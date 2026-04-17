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

  // Cargar modelos de face-api.js
  useEffect(() => {
    const cargarModelos = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
        ])
        setModelosCargados(true)
      } catch (e) {
        const error = e as Error
        console.warn('No se pudieron cargar los modelos de face-api:', error.message)
        // La app sigue funcionando sin detección facial
      }
    }
    cargarModelos()
  }, [])

  // Iniciar detección continua
  const iniciarDeteccion = useCallback(() => {
    if (!modelosCargados || !videoRef.current) return

    intervaloRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return
      try {
        const deteccion = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions()

        if (deteccion?.expressions) {
          const emocion = mapearEmocion(deteccion.expressions)
          setEmocionActual(emocion)
        }
      } catch (_error) {
        // silencioso - no interrumpe el chat
      }
    }, 2000) // detecta cada 2 segundos
  }, [modelosCargados, videoRef])

  const detenerDeteccion = useCallback(() => {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current)
      intervaloRef.current = null
    }
  }, [])

  // Iniciar cámara
  const iniciarCamara = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        iniciarDeteccion()
      }
    } catch (_error) {
      setErrorCamara(UI_TEXTS.camera.hookCameraError)
    }
  }, [videoRef, iniciarDeteccion])

  useEffect(() => {
    if (modelosCargados) iniciarCamara()
    return () => detenerDeteccion()
  }, [modelosCargados, iniciarCamara, detenerDeteccion])

  return { emocionActual, modelosCargados, errorCamara, iniciarCamara }
}
