import { useState } from 'react'

export default function ChatInput({ onEnviar, cargando }) {
  const [texto, setTexto] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!texto.trim() || cargando) return
    onEnviar(texto.trim())
    setTexto('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <textarea
        style={styles.textarea}
        placeholder="Escribe cómo te sientes hoy..."
        value={texto}
        onChange={e => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={cargando}
      />
      <button
        type="submit"
        style={{ ...styles.btn, opacity: (!texto.trim() || cargando) ? 0.5 : 1 }}
        disabled={!texto.trim() || cargando}
      >
        {cargando ? '⏳' : '➤'}
      </button>
    </form>
  )
}

const styles = {
  form: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#fff', borderRadius: 18,
    padding: '10px 16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    border: '1.5px solid #E0E0E0',
  },
  textarea: {
    flex: 1, resize: 'none', border: 'none', outline: 'none',
    fontSize: 15, background: 'transparent',
    fontFamily: 'inherit', lineHeight: 1.5,
    maxHeight: 120, overflowY: 'auto',
  },
  btn: {
    width: 42, height: 42, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6C63FF, #764ba2)',
    color: '#fff', fontSize: 18, border: 'none',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s', flexShrink: 0,
  },
}
