import { useEffect, useRef, useState, useCallback } from 'react'
import * as faceapi from 'face-api.js'

const MODELS_URL = '/models' // los modelos van en /public/models

// Mapeo de expresiones face-api → TipoEmocion del backend
const mapearEmocion = (expressions) => {
  const { happy, sad, angry, fearful, disgusted, surprised, neutral } = expressions
  const mapa = { happy, sad, angry, fearful, disgusted, surprised, neutral }
  const dominante = Object.entries(mapa).reduce((a, b) => a[1] > b[1] ? a : b)

  const tabla = {
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

export function useEmotionDetector(videoRef) {
  const [modelosCargados, setModelosCargados] = useState(false)
  const [emocionActual, setEmocionActual]     = useState({ tipo: 'NEUTRAL', intensidad: 0, raw: 'neutral' })
  const [errorCamara, setErrorCamara]         = useState(null)
  const intervaloRef = useRef(null)

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
        console.warn('No se pudieron cargar los modelos de face-api:', e.message)
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
      } catch (_) {
        // silencioso - no interrumpe el chat
      }
    }, 2000) // detecta cada 2 segundos
  }, [modelosCargados, videoRef])

  const detenerDeteccion = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current)
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
    } catch (e) {
      setErrorCamara('No se pudo acceder a la cámara. La emoción se enviará como NEUTRAL.')
    }
  }, [videoRef, iniciarDeteccion])

  useEffect(() => {
    if (modelosCargados) iniciarCamara()
    return () => detenerDeteccion()
  }, [modelosCargados])

  return { emocionActual, modelosCargados, errorCamara, iniciarCamara }
}
