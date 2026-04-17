// Muestra la emoción detectada en tiempo real
import type { EmocionDetectada, TipoEmocion } from '../../types/domain'

const EMOCIONES: Record<TipoEmocion, { emoji: string; label: string; color: string }> = {
  FELIZ:       { emoji: '😊', label: 'Feliz',       color: '#FFD700' },
  TRISTE:      { emoji: '😢', label: 'Triste',      color: '#6CA0DC' },
  ESTRESADO:   { emoji: '😰', label: 'Estresado',   color: '#FF6B6B' },
  ENOJADO:     { emoji: '😠', label: 'Enojado',     color: '#FF4444' },
  ANSIOSO:     { emoji: '😟', label: 'Ansioso',     color: '#FF8C00' },
  SORPRENDIDO: { emoji: '😲', label: 'Sorprendido', color: '#9B59B6' },
  NEUTRAL:     { emoji: '😐', label: 'Neutral',     color: '#A8D5A2' },
}

interface EmotionBadgeProps {
  emocion: EmocionDetectada;
}

export default function EmotionBadge({ emocion }: EmotionBadgeProps) {
  const info = EMOCIONES[emocion?.tipo] || EMOCIONES.NEUTRAL
  const emotionClass = `emotion-badge-${emocion?.tipo?.toLowerCase() || 'neutral'}`

  return (
    <div className={`emotion-badge ${emotionClass}`}>
      <span className="emotion-badge-emoji">{info.emoji}</span>
      <div>
        <div className="emotion-badge-label">Emoción detectada</div>
        <div className="emotion-badge-type">{info.label}</div>
      </div>
      {emocion?.intensidad > 0 && (
        <div className="emotion-badge-intensity">
          {Math.round(emocion.intensidad * 100)}%
        </div>
      )}
    </div>
  )
}
