// Burbuja de mensaje individual del chat

const EMOJIS_EMOCION = {
  FELIZ: '😊', TRISTE: '😢', ESTRESADO: '😰',
  ENOJADO: '😠', ANSIOSO: '😟', SORPRENDIDO: '😲', NEUTRAL: '😐',
}

export default function ChatBubble({ mensaje }) {
  const esIA     = mensaje.remitente === 'AI'
  const hora     = new Date(mensaje.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  const emojiEmo = mensaje.emocionAsociada ? EMOJIS_EMOCION[mensaje.emocionAsociada] : null

  return (
    <div style={{ ...styles.wrapper, justifyContent: esIA ? 'flex-start' : 'flex-end' }}>
      {esIA && <div style={styles.avatar}>🧠</div>}
      <div style={{ ...styles.bubble, ...(esIA ? styles.bubbleIA : styles.bubbleUser) }}>
        <p style={styles.texto}>{mensaje.contenido}</p>
        <div style={styles.meta}>
          {emojiEmo && !esIA && <span style={styles.emojiMeta}>{emojiEmo}</span>}
          <span style={styles.hora}>{hora}</span>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  avatar:  { fontSize: 28, flexShrink: 0 },
  bubble:  {
    maxWidth: '72%', padding: '12px 16px',
    borderRadius: 18, lineHeight: 1.5,
  },
  bubbleIA: {
    background: '#EFEFFF', color: '#2D2D2D',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    background: 'linear-gradient(135deg, #6C63FF, #764ba2)',
    color: '#fff', borderBottomRightRadius: 4,
  },
  texto:    { fontSize: 15, margin: 0 },
  meta:     { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 },
  emojiMeta: { fontSize: 12, opacity: 0.8 },
  hora:     { fontSize: 11, opacity: 0.6 },
}
