// Burbuja de mensaje individual del chat
import { useEffect, useRef } from 'react'
import type { Message, EmotionType, UserProfile } from '../../types/domain'

function formatearHora(fecha: string): string {
  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) return '--:--'
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble({ message, profile }: { message: Message, profile?: UserProfile | null }) {
  const esIA     = message.sender === 'AI'
  const hora     = formatearHora(message.createdAt)
  const bubbleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = bubbleRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(10px)'
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    })
  }, [])

  return (
    <div
      ref={bubbleRef}
      className={`light-bubble-row ${esIA ? 'light-bubble-row-ai' : 'light-bubble-row-user'}`}
    >
      {esIA && (
        <img
          className="light-avatar light-avatar-ai"
          src="/Logo.png"
          alt="MindSee"
          aria-label="Psicólogo"
          style={{ objectFit: 'cover' }}
        />
      )}

      <div className={`light-bubble-content-wrapper ${esIA ? 'wrapper-ai' : 'wrapper-user'}`}>
        <div className={`light-bubble ${esIA ? 'light-bubble-ai' : 'light-bubble-user'}`}>
          <p className="light-bubble-text">{message.content}</p>
        </div>
        <div className={`light-bubble-time ${esIA ? 'time-left' : 'time-right'}`}>
          {hora}
        </div>
      </div>

      {!esIA && (
        <div className="light-avatar light-avatar-user" aria-label="Usuario" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar Usuario" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span>TÚ</span>
          )}
        </div>
      )}
    </div>
  )
}
