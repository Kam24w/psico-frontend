import { useRef, useEffect, useState } from 'react'
import { useEmotionDetector } from '../../hooks/useEmotionDetector'
import EmotionBadge from './EmotionBadge'
import type { DetectedEmotion } from '../../types/domain'
import { UI_TEXTS } from '../../constants/texts'
import { useAuth } from '../../context/AuthContext'

interface CameraPanelProps {
  onEmotionChange?: (emotion: DetectedEmotion) => void;
}

export default function CameraPanel({ onEmotionChange }: CameraPanelProps) {
  const texts = UI_TEXTS.camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const { user } = useAuth()
  
  // Always pass videoRef so emotion detection continues even when visually hidden.
  const { currentEmotion, modelsLoaded, cameraError } = useEmotionDetector(videoRef)

  // Notify parent when emotion changes
  useEffect(() => {
    if (onEmotionChange) {
      onEmotionChange(currentEmotion)
    }
  }, [currentEmotion, onEmotionChange])

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

        {!modelsLoaded && (
          <div className="camera-overlay" style={{ zIndex: 6 }}>
            <span className="camera-overlay-text">🔄 {texts.loadingDetection}</span>
          </div>
        )}

        {!cameraError && (
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

      {cameraError && (
        <p className="camera-error">⚠️ {texts.cameraAccessErrorPrefix} {cameraError}</p>
      )}

      <EmotionBadge emotion={currentEmotion} />

      <p className="camera-hint">
        {texts.hint}
      </p>
    </div>
  )
}
