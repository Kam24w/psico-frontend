import { useState } from 'react'
import type { EmotionType } from '../../types/domain'

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, emotion: EmotionType) => Promise<void>;
}

const EMOTIONS: { type: EmotionType; emoji: string; label: string }[] = [
  { type: 'HAPPY', emoji: '😊', label: 'Feliz' },
  { type: 'NEUTRAL', emoji: '😐', label: 'Neutral' },
  { type: 'SAD', emoji: '😢', label: 'Triste' },
  { type: 'STRESSED', emoji: '😰', label: 'Estresado' },
  { type: 'ANXIOUS', emoji: '😟', label: 'Ansioso' },
  { type: 'ANGRY', emoji: '😠', label: 'Enojado' },
  { type: 'SURPRISED', emoji: '😲', label: 'Sorprendido' },
]

export default function AddMemoryModal({ isOpen, onClose, onSave }: AddMemoryModalProps) {
  const [text, setText] = useState('')
  const [emotion, setEmotion] = useState<EmotionType>('NEUTRAL')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      await onSave(text, emotion)
      setText('')
      setEmotion('NEUTRAL')
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="memory-modal-overlay">
      <div className="memory-modal-content">
        <button className="memory-modal-close" onClick={onClose}>&times;</button>
        <h2 className="memory-modal-title">¿Qué tienes en mente?</h2>
        <p className="memory-modal-subtitle">Guarda tus pensamientos y cómo te sientes ahora mismo.</p>
        
        <form onSubmit={handleSubmit} className="memory-form">
          <textarea
            className="memory-textarea"
            placeholder="Escribe tu memoria o pensamiento aquí..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            required
          />

          <div className="memory-emotion-selector">
            <p className="emotion-selector-title">¿Cómo te sientes al respecto?</p>
            <div className="emotion-options">
              {EMOTIONS.map(emo => (
                <button
                  key={emo.type}
                  type="button"
                  className={`emotion-option-btn ${emotion === emo.type ? 'selected' : ''}`}
                  onClick={() => setEmotion(emo.type)}
                  title={emo.label}
                >
                  <span className="emotion-option-emoji">{emo.emoji}</span>
                  <span className="emotion-option-label">{emo.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="memory-form-actions">
            <button type="button" className="memory-btn-cancel" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="memory-btn-save" disabled={loading || !text.trim()}>
              {loading ? 'Guardando...' : 'Guardar Memoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
