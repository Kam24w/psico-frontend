// Burbuja de mensaje individual del chat
import type { Mensaje, TipoEmocion } from '../../types/domain'

const EMOJIS_EMOCION: Record<TipoEmocion, string> = {
  FELIZ: '😊', TRISTE: '😢', ESTRESADO: '😰',
  ENOJADO: '😠', ANSIOSO: '😟', SORPRENDIDO: '😲', NEUTRAL: '😐',
}

export default function ChatBubble({ mensaje }: { mensaje: Mensaje }) {
  const esIA     = mensaje.remitente === 'AI'
  const hora     = new Date(mensaje.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  const emojiEmo = mensaje.emocionAsociada ? EMOJIS_EMOCION[mensaje.emocionAsociada] : null

  return (
    <div className={`chat-bubble-row ${esIA ? 'chat-bubble-row-ai' : 'chat-bubble-row-user'}`}>
      {esIA && <div className="chat-bubble-avatar">🧠</div>}
      <div className={`chat-bubble ${esIA ? 'chat-bubble-ai' : 'chat-bubble-user'}`}>
        <p className="chat-bubble-text">{mensaje.contenido}</p>
        <div className="chat-bubble-meta">
          {emojiEmo && !esIA && <span className="chat-bubble-emoji-meta">{emojiEmo}</span>}
          <span className="chat-bubble-time">{hora}</span>
        </div>
      </div>
    </div>
  )
}
