import { useRef, useEffect, useState } from 'react'
import { useEmotionDetector } from '../../hooks/useEmotionDetector'
import EmotionBadge from './EmotionBadge'
import type { EmocionDetectada } from '../../types/domain'
import { UI_TEXTS } from '../../constants/texts'
import { useAuth } from '../../context/AuthContext'

interface CameraPanelProps {
  onEmocionCambia?: (emocion: EmocionDetectada) => void;
}

export default function CameraPanel({ onEmocionCambia }: CameraPanelProps) {
  const texts = UI_TEXTS.camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const { user } = useAuth()
  
  // Siempre pasamos el videoRef para que siga detectando emociones, incluso si está oculto visualmente.
  const { emocionActual, modelosCargados, errorCamara } = useEmotionDetector(videoRef)

  // Notificar al padre cuando cambia la emoción de forma segura
  useEffect(() => {
    if (onEmocionCambia) {
      onEmocionCambia(emocionActual)
    }
  }, [emocionActual, onEmocionCambia])

  return (
    <div className="camera-panel">
      <div className="camera-video-wrapper" style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          className="camera-video"
          muted
          playsInline
          autoPlay
          style={{ opacity: isCameraOff ? 0 : 1, transition: 'opacity 0.3s', width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {isCameraOff && (
          <div className="camera-overlay" style={{ background: 'rgba(15, 12, 41, 0.95)', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 5 }}>
            <span style={{ fontSize: '48px', marginBottom: '8px', color: 'rgba(196, 181, 253, 0.9)' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="camera-overlay-text">Cámara Oculta</span>
          </div>
        )}

        {!modelosCargados && (
          <div className="camera-overlay" style={{ zIndex: 6 }}>
            <span className="camera-overlay-text">🔄 {texts.loadingDetection}</span>
          </div>
        )}

        {!errorCamara && (
          <button
            onClick={() => setIsCameraOff(!isCameraOff)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              zIndex: 10,
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s ease'
            }}
            title={isCameraOff ? "Mostrar cámara" : "Ocultar cámara"}
          >
            <span style={{ fontSize: '16px' }}>{isCameraOff ? '🙈' : '👁️'}</span>
          </button>
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
