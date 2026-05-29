// Muestra la emoción detectada en tiempo real
import type { DetectedEmotion, EmotionType } from '../../types/domain'
import { UI_TEXTS } from '../../constants/texts'

const EMOCIONES: Record<string, { emoji: string; label: string; color: string }> = {
  HAPPY:       { emoji: '😊', label: UI_TEXTS.emotionBadge.labels.FELIZ,       color: '#FFD700' },
  SAD:         { emoji: '😢', label: UI_TEXTS.emotionBadge.labels.TRISTE,      color: '#6CA0DC' },
  STRESSED:    { emoji: '😰', label: UI_TEXTS.emotionBadge.labels.ESTRESADO,   color: '#FF6B6B' },
  ANGRY:       { emoji: '😠', label: UI_TEXTS.emotionBadge.labels.ENOJADO,     color: '#FF4444' },
  ANXIOUS:     { emoji: '😟', label: UI_TEXTS.emotionBadge.labels.ANSIOSO,     color: '#FF8C00' },
  SURPRISED:   { emoji: '😲', label: UI_TEXTS.emotionBadge.labels.SORPRENDIDO, color: '#9B59B6' },
  NEUTRAL:     { emoji: '😐', label: UI_TEXTS.emotionBadge.labels.NEUTRAL,     color: '#A8D5A2' },
  // Spanish aliases for fallback compatibility
  FELIZ:       { emoji: '😊', label: UI_TEXTS.emotionBadge.labels.FELIZ,       color: '#FFD700' },
  TRISTE:      { emoji: '😢', label: UI_TEXTS.emotionBadge.labels.TRISTE,      color: '#6CA0DC' },
  ESTRESADO:   { emoji: '😰', label: UI_TEXTS.emotionBadge.labels.ESTRESADO,   color: '#FF6B6B' },
  ENOJADO:     { emoji: '😠', label: UI_TEXTS.emotionBadge.labels.ENOJADO,     color: '#FF4444' },
  ANSIOSO:     { emoji: '😟', label: UI_TEXTS.emotionBadge.labels.ANSIOSO,     color: '#FF8C00' },
  SORPRENDIDO: { emoji: '😲', label: UI_TEXTS.emotionBadge.labels.SORPRENDIDO, color: '#9B59B6' },
}

interface EmotionBadgeProps {
  emotion: DetectedEmotion;
}

export default function EmotionBadge({ emotion }: EmotionBadgeProps) {
  const typeKey = emotion?.type || (emotion as any)?.tipo || 'NEUTRAL'
  const intensityVal = emotion?.intensity ?? (emotion as any)?.intensidad ?? 0
  
  const info = EMOCIONES[typeKey] || EMOCIONES.NEUTRAL
  const emotionClass = `emotion-badge-${typeKey.toLowerCase()}`

  return (
    <div className={`emotion-badge ${emotionClass}`}>
      <span className="emotion-badge-emoji">{info.emoji}</span>
      <div>
        <div className="emotion-badge-label">{UI_TEXTS.emotionBadge.detectedEmotionLabel}</div>
        <div className="emotion-badge-type">{info.label}</div>
      </div>
      {intensityVal > 0 && (
        <div className="emotion-badge-intensity">
          {Math.round(intensityVal * 100)}%
        </div>
      )}
    </div>
  )
}
