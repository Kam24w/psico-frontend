import { useState, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerIcon}>🧠</span>
        <div>
          <div style={styles.headerTitle}>Psicólogo Virtual</div>
          <div style={styles.headerSub}>● En línea</div>
        </div>
      </div>

      {/* Mensajes */}
      <div style={styles.mensajes}>
        {mensajes.map(msg => (
          <ChatBubble key={msg.id} mensaje={msg} />
        ))}
        {cargando && (
          <div style={styles.typing}>
            <div style={styles.typingBubble}>
              <span style={styles.dot} />
              <span style={styles.dot} />
              <span style={styles.dot} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <ChatInput onEnviar={enviarMensaje} cargando={cargando} />
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    flex: 1, display: 'flex', flexDirection: 'column',
    background: '#F8F8FF', borderRadius: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #6C63FF, #764ba2)',
    color: '#fff',
  },
  headerIcon:  { fontSize: 32 },
  headerTitle: { fontSize: 18, fontWeight: 700 },
  headerSub:   { fontSize: 12, opacity: 0.85 },
  mensajes: {
    flex: 1, overflowY: 'auto',
    padding: '20px 24px',
    display: 'flex', flexDirection: 'column',
  },
  inputArea: { padding: '12px 16px', background: '#fff', borderTop: '1px solid #F0F0F0' },
  typing: { display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  typingBubble: {
    background: '#EFEFFF', borderRadius: 18, borderBottomLeftRadius: 4,
    padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center',
  },
  dot: {
    width: 8, height: 8, borderRadius: '50%', background: '#6C63FF',
    display: 'inline-block',
    animation: 'bounce 1.4s infinite ease-in-out',
  },
}
