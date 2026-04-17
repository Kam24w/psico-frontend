import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { UI_TEXTS } from '../../constants/texts'

interface ChatInputProps {
  onEnviar: (contenido: string) => void;
  cargando: boolean;
}

export default function ChatInput({ onEnviar, cargando }: ChatInputProps) {
  const texts = UI_TEXTS.chatInput
  const [texto, setTexto] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!texto.trim() || cargando) return
    onEnviar(texto.trim())
    setTexto('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!texto.trim() || cargando) return
      onEnviar(texto.trim())
      setTexto('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <textarea
        className="chat-input-textarea"
        placeholder={texts.placeholder}
        value={texto}
        onChange={e => setTexto(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={cargando}
      />
      <button
        type="submit"
        className="chat-input-button"
        disabled={!texto.trim() || cargando}
      >
        {cargando ? texts.loadingIcon : texts.submitIcon}
      </button>
    </form>
  )
}
