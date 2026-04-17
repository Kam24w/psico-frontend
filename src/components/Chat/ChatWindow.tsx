import { useState, useEffect, useRef } from 'react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import { conversacionService, emocionService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import type { EmocionDetectada, Mensaje } from '../../types/domain'

interface ChatWindowProps {
  emocionActual: EmocionDetectada;
}

export default function ChatWindow({ emocionActual }: ChatWindowProps) {
  const { usuario }   = useAuth()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mensaje de bienvenida
  useEffect(() => {
    setMensajes([{
      id: 0,
      contenido: `¡Hola, ${usuario?.nombre}! 😊 Soy tu acompañante emocional. Estoy aquí para escucharte. ¿Cómo te sientes hoy?`,
      remitente: 'AI',
      emocionAsociada: null,
      fecha: new Date().toISOString(),
    }])
  }, [usuario])

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviarMensaje = async (contenido: string) => {
    if (!usuario?.id) return

    // Mostrar mensaje del usuario inmediatamente
    const msgUsuario: Mensaje = {
      id: Date.now(),
      contenido,
      remitente: 'USER',
      emocionAsociada: emocionActual?.tipo || 'NEUTRAL',
      fecha: new Date().toISOString(),
    }
    setMensajes(prev => [...prev, msgUsuario])
    setCargando(true)

    try {
      // Registrar emoción en el backend (Observer)
      if (emocionActual?.tipo) {
        await emocionService.registrar(
          usuario.id,
          emocionActual.tipo,
          emocionActual.intensidad || 0.5
        )
      }

      // Enviar mensaje + emoción al backend
      const res = await conversacionService.enviarMensaje(
        usuario.id,
        contenido,
        emocionActual?.tipo || 'NEUTRAL'
      )

      // Mostrar respuesta de la IA
      setMensajes(prev => [...prev, res.data])
    } catch (_err) {
      setMensajes(prev => [...prev, {
        id: Date.now() + 1,
        contenido: 'Lo siento, hubo un problema al procesar tu mensaje. ¿Puedes intentarlo de nuevo?',
        remitente: 'AI',
        emocionAsociada: null,
        fecha: new Date().toISOString(),
      }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-window-header">
        <span className="chat-window-header-icon">🧠</span>
        <div>
          <div className="chat-window-header-title">Psicólogo Virtual</div>
          <div className="chat-window-header-sub">● En línea</div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="chat-window-messages">
        {mensajes.map(msg => (
          <ChatBubble key={msg.id} mensaje={msg} />
        ))}
        {cargando && (
          <div className="chat-window-typing-row">
            <div className="chat-window-typing-bubble">
              <span className="chat-window-typing-dot" />
              <span className="chat-window-typing-dot" />
              <span className="chat-window-typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-window-input-area">
        <ChatInput onEnviar={enviarMensaje} cargando={cargando} />
      </div>
    </div>
  )
}
