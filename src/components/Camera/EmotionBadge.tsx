// Muestra la emoción detectada en tiempo real
import type { EmocionDetectada, TipoEmocion } from '../../types/domain'
import { UI_TEXTS } from '../../constants/texts'

const EMOCIONES: Record<TipoEmocion, { emoji: string; label: string; color: string }> = {
  FELIZ:       { emoji: '😊', label: UI_TEXTS.emotionBadge.labels.FELIZ,       color: '#FFD700' },
  TRISTE:      { emoji: '😢', label: UI_TEXTS.emotionBadge.labels.TRISTE,      color: '#6CA0DC' },
  ESTRESADO:   { emoji: '😰', label: UI_TEXTS.emotionBadge.labels.ESTRESADO,   color: '#FF6B6B' },
  ENOJADO:     { emoji: '😠', label: UI_TEXTS.emotionBadge.labels.ENOJADO,     color: '#FF4444' },
  ANSIOSO:     { emoji: '😟', label: UI_TEXTS.emotionBadge.labels.ANSIOSO,     color: '#FF8C00' },
  SORPRENDIDO: { emoji: '😲', label: UI_TEXTS.emotionBadge.labels.SORPRENDIDO, color: '#9B59B6' },
  NEUTRAL:     { emoji: '😐', label: UI_TEXTS.emotionBadge.labels.NEUTRAL,     color: '#A8D5A2' },
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
        <div className="emotion-badge-label">{UI_TEXTS.emotionBadge.detectedEmotionLabel}</div>
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
