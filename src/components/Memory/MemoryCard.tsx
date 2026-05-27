import type { UserMemory, EmotionType } from '../../types/domain'

interface MemoryCardProps {
  memory: UserMemory;
}

const getEmotionConfig = (emotion: EmotionType | null) => {
  switch (emotion) {
    case 'HAPPY': return { emoji: '😊', label: 'Feliz', colorClass: 'emotion-happy' }
    case 'SAD': return { emoji: '😢', label: 'Triste', colorClass: 'emotion-sad' }
    case 'STRESSED': return { emoji: '😰', label: 'Estresado', colorClass: 'emotion-stressed' }
    case 'ANGRY': return { emoji: '😠', label: 'Enojado', colorClass: 'emotion-angry' }
    case 'ANXIOUS': return { emoji: '😟', label: 'Ansioso', colorClass: 'emotion-anxious' }
    case 'SURPRISED': return { emoji: '😲', label: 'Sorprendido', colorClass: 'emotion-surprised' }
    case 'NEUTRAL':
    default: return { emoji: '😐', label: 'Neutral', colorClass: 'emotion-neutral' }
  }
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  const config = getEmotionConfig(memory.associatedEmotion)
  const dateStr = new Date(memory.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className={`memory-card ${config.colorClass}`}>
      <div className="memory-card-header">
        <div className="memory-emotion-badge">
          <span className="memory-emoji">{config.emoji}</span>
          <span className="memory-label">{config.label}</span>
        </div>
        <span className="memory-date">{dateStr}</span>
      </div>
      <div className="memory-card-body">
        <p className="memory-text">{memory.text}</p>
      </div>
    </div>
  )
}
