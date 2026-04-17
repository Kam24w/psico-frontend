import { useState, useEffect, useRef } from 'react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import { conversacionService, emocionService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import type { EmocionDetectada, Mensaje } from '../../types/domain'
import { UI_TEXTS } from '../../constants/texts'

interface ChatWindowProps {
  emocionActual: EmocionDetectada;
}

type RawMensaje = Partial<Mensaje> & {
  fecha?: unknown;
  remitente?: unknown;
  emocionAsociada?: unknown;
};

function toIsoFromJavaArray(value: unknown): string | null {
  if (!Array.isArray(value) || value.length < 5) return null;

  const [year, month, day, hour, minute, second = 0, nano = 0] = value;
  if (
    typeof year !== 'number' ||
    typeof month !== 'number' ||
    typeof day !== 'number' ||
    typeof hour !== 'number' ||
    typeof minute !== 'number' ||
    typeof second !== 'number' ||
    typeof nano !== 'number'
  ) {
    return null;
  }

  const millis = Math.floor(nano / 1_000_000);
  const pad = (num: number, size = 2) => String(num).padStart(size, '0');
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millis, 3)}`;
}

function sanitizeIsoDate(value: string): string {
  // Java LocalDateTime puede venir con nanosegundos; JS Date acepta milisegundos.
  return value.replace(/(\.\d{3})\d+/, '$1');
}

function normalizarMensaje(raw: RawMensaje, fallbackText: string): Mensaje {
  const rawDate = raw.fecha;
  const fecha = typeof rawDate === 'string'
    ? sanitizeIsoDate(rawDate)
    : toIsoFromJavaArray(rawDate) || new Date().toISOString();

  const remitente = raw.remitente === 'AI' ? 'AI' : 'USER';
  const emocionAsociada =
    raw.emocionAsociada === 'FELIZ' ||
    raw.emocionAsociada === 'TRISTE' ||
    raw.emocionAsociada === 'ESTRESADO' ||
    raw.emocionAsociada === 'ENOJADO' ||
    raw.emocionAsociada === 'ANSIOSO' ||
    raw.emocionAsociada === 'SORPRENDIDO' ||
    raw.emocionAsociada === 'NEUTRAL'
      ? raw.emocionAsociada
      : null;

  return {
    id: typeof raw.id === 'number' ? raw.id : Date.now(),
    contenido: typeof raw.contenido === 'string' && raw.contenido.trim()
      ? raw.contenido
      : fallbackText,
    remitente,
    emocionAsociada,
    fecha,
  };
}

export default function ChatWindow({ emocionActual }: ChatWindowProps) {
  const texts = UI_TEXTS.chatWindow
  const { usuario }   = useAuth()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mensaje de bienvenida
  useEffect(() => {
    setMensajes([{
      id: 0,
      contenido: texts.welcomeMessage(usuario?.nombre),
      remitente: 'AI',
      emocionAsociada: null,
      fecha: new Date().toISOString(),
    }])
  }, [texts, usuario])

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
      setMensajes(prev => [...prev, normalizarMensaje(res.data as RawMensaje, texts.genericErrorResponse)])
    } catch (_err) {
      setMensajes(prev => [...prev, {
        id: Date.now() + 1,
        contenido: texts.genericErrorResponse,
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
          <div className="chat-window-header-title">{texts.title}</div>
          <div className="chat-window-header-sub">● {texts.online}</div>
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
