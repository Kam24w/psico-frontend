import { useRef } from 'react'
import { useEmotionDetector } from '../../hooks/useEmotionDetector'
import EmotionBadge from './EmotionBadge'
import type { EmocionDetectada } from '../../types/domain'
import { UI_TEXTS } from '../../constants/texts'

interface CameraPanelProps {
  onEmocionCambia?: (emocion: EmocionDetectada) => void;
}

export default function CameraPanel({ onEmocionCambia }: CameraPanelProps) {
  const texts = UI_TEXTS.camera
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
            <span className="camera-overlay-text">🔄 {texts.loadingDetection}</span>
          </div>
        )}
      </div>

      {errorCamara && (
        <p className="camera-error">⚠️ {texts.cameraAccessErrorPrefix} {errorCamara}</p>
      )}

      <EmotionBadge emocion={emocionActual} />

      <p className="camera-hint">
        {texts.hint}
      </p>
    </div>
  )
}
