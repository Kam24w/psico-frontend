import { useEffect, useRef, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import * as faceapi from 'face-api.js'
import type { DetectedEmotion, EmotionType } from '../types/domain'
import { UI_TEXTS } from '../constants/texts'

const MODELS_URL = '/models' // models are stored in /public/models

// Maps face-api expressions to backend EmotionType constants
const mapEmotion = (expressions: Record<string, number>): DetectedEmotion => {
  const { happy, sad, angry, fearful, disgusted, surprised, neutral } = expressions
  const mapData = { happy, sad, angry, fearful, disgusted, surprised, neutral }
  const dominant = Object.entries(mapData).reduce((a, b) => a[1] > b[1] ? a : b)

  const table: Record<string, EmotionType> = {
    happy:     'HAPPY',
    sad:       'SAD',
    angry:     'ANGRY',
    fearful:   'ANXIOUS',
    disgusted: 'STRESSED',
    surprised: 'SURPRISED',
    neutral:   'NEUTRAL',
  }
  return {
    type:       table[dominant[0]] || 'NEUTRAL',
    intensity: parseFloat(dominant[1].toFixed(2)),
    raw:        dominant[0],
  }
}

export function useEmotionDetector(videoRef: RefObject<HTMLVideoElement>, shouldStart: boolean = true) {
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [currentEmotion, setCurrentEmotion]     = useState<DetectedEmotion>({ type: 'NEUTRAL', intensity: 0, raw: 'neutral' })
  const [cameraError, setCameraError]         = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Load face-api.js models
  useEffect(() => {
    if (!shouldStart) return;

    const loadModels = async () => {
      try {
        console.log("Initializing face-api and TF...");
        try {
          const tf = (faceapi as any).tf;
          if (tf) {
            // Attempt to use WebGL (GPU Acceleration) for ultra-fast performance
            try {
              if (typeof tf.setBackend === 'function') {
                await tf.setBackend('webgl');
                console.log("TF backend set to: webgl (GPU accelerated!)");
              }
            } catch (webglError) {
              console.warn("WebGL not supported or failed, falling back to CPU:", webglError);
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
          setModelsLoaded(true);
        }
      } catch (e) {
        const error = e as Error
        console.warn('Could not load face-api models:', error.message)
      }
    }
    loadModels()
  }, [shouldStart])

  // Continuously detect emotion safely
  const startDetection = useCallback(() => {
    if (!modelsLoaded || !videoRef.current) return

    const detect = async () => {
      if (!isMountedRef.current || !videoRef.current || videoRef.current.readyState < 2) {
         if (isMountedRef.current) timerRef.current = setTimeout(detect, 2000)
         return
      }

      try {
        // Do not detect if AI is currently speaking to avoid high CPU usage
        if (window.speechSynthesis.speaking) {
            if (isMountedRef.current) timerRef.current = setTimeout(detect, 5000)
            return
        }

        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions()

        if (detection?.expressions && isMountedRef.current) {
          const emotion = mapEmotion(detection.expressions)
          setCurrentEmotion(emotion)
        }
      } catch (err: any) {
        if (err?.message && !err.message.includes('backend') && !err.message.includes('undefined')) {
          console.warn("Detection error:", err.message)
        }
      }

      if (isMountedRef.current) {
        timerRef.current = setTimeout(detect, 5000)
      }
    }

    detect()
  }, [modelsLoaded, videoRef])

  const stopDetection = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Initialize camera
  const startCamera = useCallback(async () => {
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
        startDetection()
      }
    } catch (_error) {
      if (isMountedRef.current) {
        setCameraError(UI_TEXTS.camera.hookCameraError)
      }
    }
  }, [videoRef, startDetection])

  useEffect(() => {
    if (modelsLoaded && shouldStart) startCamera()
    return () => {
      stopDetection()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [modelsLoaded, startCamera, stopDetection, videoRef, shouldStart])

  // Aliases for Spanish transition compatibility
  return { 
    currentEmotion, 
    modelsLoaded, 
    cameraError, 
    startCamera,
    emocionActual: currentEmotion,
    modelosCargados: modelsLoaded,
    errorCamara: cameraError,
    iniciarCamara: startCamera
  }
}
