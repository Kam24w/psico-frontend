import { useState, useRef, useEffect } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { UI_TEXTS } from '../../constants/texts'

interface ChatInputProps {
  onEnviar: (contenido: string) => void;
  cargando: boolean;
}

export default function ChatInput({ onEnviar, cargando }: ChatInputProps) {
  const texts = UI_TEXTS.chatInput
  const [texto, setTexto] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [texto])

  useEffect(() => {
    // Inicializar SpeechRecognition si está disponible
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'es-ES' // O el idioma que prefieras

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setTexto((prev) => prev ? prev + ' ' + transcript : transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Error de reconocimiento de voz:', event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognitionRef.current = recognition
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch(e) {}
      }
    }
  }, [])

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

  const handleAttachment = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      alert(`Has seleccionado el archivo: "${e.target.files[0].name}".\n\nEl análisis de documentos/imágenes está en desarrollo.`);
      // Resetear para permitir seleccionar el mismo archivo de nuevo
      e.target.value = '';
    }
  }

  const handleAudio = () => {
    if (!recognitionRef.current) {
      alert('Tu navegador no soporta dictado por voz. Te recomendamos usar Google Chrome o Edge.')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
      } catch (err) {
        console.error('No se pudo iniciar el dictado', err)
      }
    }
  }

  const hasText = texto.trim().length > 0

  return (
    <div className="light-input-container">
      <form onSubmit={handleSubmit} className="light-input-form" id="chat-input-form">
        <textarea
          ref={textareaRef}
          className="light-textarea"
          placeholder="Escribe tu mensaje..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={cargando}
        />

        <div className="light-input-actions">
          {/* File picker oculto */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden-file-input"
            onChange={handleFileChange} 
          />
          
          <button type="button" className="light-icon-btn" aria-label="Adjuntar" onClick={handleAttachment} title="Adjuntar archivo">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          <button 
            type="button" 
            className={`light-icon-btn ${isRecording ? 'recording' : ''}`} 
            aria-label="Audio" 
            onClick={handleAudio} 
            title={isRecording ? "Detener grabación" : "Dictado por voz"}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          
          <button
            type="submit"
            className={`light-send-btn ${hasText && !cargando ? 'ready' : ''}`}
            disabled={!hasText || cargando}
          >
            {cargando ? (
              <span className="light-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="white" strokeWidth="2" fill="white" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </form>
      <div className="security-badge-inline">
        🔒 Conexión cifrada de extremo a extremo
      </div>
    </div>
  )
}
