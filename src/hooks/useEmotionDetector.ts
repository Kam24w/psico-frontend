import { useEffect, useRef, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import * as faceapi from 'face-api.js'
import type { EmocionDetectada } from '../types/domain'
import { UI_TEXTS } from '../constants/texts'

const MODELS_URL = '/models' // los modelos van en /public/models

// Mapeo de expresiones face-api → TipoEmocion del backend
const mapearEmocion = (expressions: Record<string, number>): EmocionDetectada => {
  const { happy, sad, angry, fearful, disgusted, surprised, neutral } = expressions
  const mapa = { happy, sad, angry, fearful, disgusted, surprised, neutral }
  const dominante = Object.entries(mapa).reduce((a, b) => a[1] > b[1] ? a : b)

  const tabla: Record<string, EmocionDetectada['tipo']> = {
    happy:     'FELIZ',
    sad:       'TRISTE',
    angry:     'ENOJADO',
    fearful:   'ANSIOSO',
    disgusted: 'ESTRESADO',
    surprised: 'SORPRENDIDO',
    neutral:   'NEUTRAL',
  }
  return {
    tipo:       tabla[dominante[0]] || 'NEUTRAL',
    intensidad: parseFloat(dominante[1].toFixed(2)),
    raw:        dominante[0],
  }
}

export function useEmotionDetector(videoRef: RefObject<HTMLVideoElement>) {
  const [modelosCargados, setModelosCargados] = useState(false)
  const [emocionActual, setEmocionActual]     = useState<EmocionDetectada>({ tipo: 'NEUTRAL', intensidad: 0, raw: 'neutral' })
  const [errorCamara, setErrorCamara]         = useState<string | null>(null)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Cargar modelos de face-api.js
  useEffect(() => {
    const cargarModelos = async () => {
      try {
        // Asegurar que el backend de TensorFlow esté listo
        console.log("Initializing face-api and TF...");
        try {
          const tf = (faceapi as any).tf;
          if (tf) {
            // Intenta usar WebGL (Aceleración por GPU) para un rendimiento ultra rápido
            try {
              if (typeof tf.setBackend === 'function') {
                await tf.setBackend('webgl');
                console.log("TF backend set to: webgl (GPU accelerated!)");
              }
            } catch (webglError) {
              console.warn("WebGL not supported or failed, falling back to CPU:", webglError);
              // Desactivar WebGL e ir a CPU como fallback seguro
              if (tf.ENV && tf.ENV.set) {
                tf.ENV.set('WEBGL_VERSION', 0);
              }
              if (typeof tf.setBackend === 'function') {
                await tf.setBackend('cpu');
                console.log("Forced TF backend to: cpu");
              }
            }
          }
        } catch (tfError) {
          console.warn("Could not configure TF backend:", tfError);
        }
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
        ]);
        
        console.log("Face-api models loaded successfully");
        if (isMountedRef.current) {
          setModelosCargados(true);
        }
      } catch (e) {
        const error = e as Error
        console.warn('No se pudieron cargar los modelos de face-api:', error.message)
        // La app sigue funcionando sin detección facial
      }
    }
    cargarModelos()
  }, [])

  // Iniciar detección continua de forma segura (recursiva con setTimeout)
  const iniciarDeteccion = useCallback(() => {
    if (!modelosCargados || !videoRef.current) return

    const detectar = async () => {
      if (!isMountedRef.current || !videoRef.current || videoRef.current.readyState < 2) {
         if (isMountedRef.current) intervaloRef.current = setTimeout(detectar, 2000)
         return
      }

      try {
        // No detectar si la IA está hablando para no saturar el CPU
        if (window.speechSynthesis.speaking) {
           if (isMountedRef.current) intervaloRef.current = setTimeout(detectar, 5000)
           return
        }

        const deteccion = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions()

        if (deteccion?.expressions && isMountedRef.current) {
          const emocion = mapearEmocion(deteccion.expressions)
          setEmocionActual(emocion)
        }
      } catch (err: any) {
        // Ignorar silenciosamente el error de TF backend/WebGL
        // face-api.js tiene su propio TF bundleado que no podemos controlar externamente
        if (err?.message && !err.message.includes('backend') && !err.message.includes('undefined')) {
          console.warn("Detection error:", err.message)
        }
      }

      if (isMountedRef.current) {
        intervaloRef.current = setTimeout(detectar, 5000)
      }
    }

    detectar()
  }, [modelosCargados, videoRef])

  const detenerDeteccion = useCallback(() => {
    if (intervaloRef.current) {
      clearTimeout(intervaloRef.current)
      intervaloRef.current = null
    }
  }, [])

  // Iniciar cámara
  const iniciarCamara = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        iniciarDeteccion()
      }
    } catch (_error) {
      if (isMountedRef.current) {
        setErrorCamara(UI_TEXTS.camera.hookCameraError)
      }
    }
  }, [videoRef, iniciarDeteccion])

  useEffect(() => {
    if (modelosCargados) iniciarCamara()
    return () => {
      detenerDeteccion()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [modelosCargados, iniciarCamara, detenerDeteccion, videoRef])

  return { emocionActual, modelosCargados, errorCamara, iniciarCamara }
}
