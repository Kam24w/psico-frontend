import { useRef } from 'react'
import { useEmotionDetector } from '../../hooks/useEmotionDetector'
import EmotionBadge from './EmotionBadge'

export default function CameraPanel({ onEmocionCambia }) {
  const videoRef = useRef(null)
  const { emocionActual, modelosCargados, errorCamara } = useEmotionDetector(videoRef)

  // Notificar al padre cuando cambia la emoción
  if (onEmocionCambia) onEmocionCambia(emocionActual)

  return (
    <div style={styles.panel}>
      <div style={styles.videoWrapper}>
        <video
          ref={videoRef}
          style={styles.video}
          muted
          playsInline
          autoPlay
        />
        {!modelosCargados && (
          <div style={styles.overlay}>
            <span style={styles.overlayText}>🔄 Cargando detección...</span>
          </div>
        )}
      </div>

      {errorCamara && (
        <p style={styles.error}>⚠️ {errorCamara}</p>
      )}

      <EmotionBadge emocion={emocionActual} />

      <p style={styles.hint}>
        Tu cámara analiza tu estado emocional en tiempo real para personalizar las respuestas.
      </p>
    </div>
  )
}

const styles = {
  panel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 12, padding: 16,
    background: '#fff', borderRadius: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    width: 260,
  },
  videoWrapper: { position: 'relative', width: '100%' },
  video: {
    width: '100%', borderRadius: 14, background: '#1a1a2e',
    transform: 'scaleX(-1)', // espejo
    aspectRatio: '4/3', objectFit: 'cover',
  },
  overlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)', borderRadius: 14,
  },
  overlayText: { color: '#fff', fontSize: 14 },
  error: { fontSize: 12, color: '#FF6B6B', textAlign: 'center' },
  hint:  { fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 1.5 },
}
