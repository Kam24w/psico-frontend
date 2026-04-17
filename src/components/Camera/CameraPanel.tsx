import { useRef } from 'react'
import { useEmotionDetector } from '../../hooks/useEmotionDetector'
import EmotionBadge from './EmotionBadge'
import type { EmocionDetectada } from '../../types/domain'

interface CameraPanelProps {
  onEmocionCambia?: (emocion: EmocionDetectada) => void;
}

export default function CameraPanel({ onEmocionCambia }: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { emocionActual, modelosCargados, errorCamara } = useEmotionDetector(videoRef)

  // Notificar al padre cuando cambia la emoción
  if (onEmocionCambia) onEmocionCambia(emocionActual)

  return (
    <div className="camera-panel">
      <div className="camera-video-wrapper">
        <video
          ref={videoRef}
          className="camera-video"
          muted
          playsInline
          autoPlay
        />
        {!modelosCargados && (
          <div className="camera-overlay">
            <span className="camera-overlay-text">🔄 Cargando detección...</span>
          </div>
        )}
      </div>

      {errorCamara && (
        <p className="camera-error">⚠️ {errorCamara}</p>
      )}

      <EmotionBadge emocion={emocionActual} />

      <p className="camera-hint">
        Tu cámara analiza tu estado emocional en tiempo real para personalizar las respuestas.
      </p>
    </div>
  )
}
