import { useState, useEffect, useRef } from 'react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import { conversacionService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import type { EmocionDetectada, Mensaje, Conversacion } from '../../types/domain'

interface ChatWindowProps {
  emocionActual: EmocionDetectada;
}

export default function ChatWindow({ emocionActual }: ChatWindowProps) {
  const { usuario } = useAuth()
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [historialSesiones, setHistorialSesiones] = useState<Conversacion[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [notas, setNotas] = useState(() => localStorage.getItem('psico_notas') || '')
  
  const [ajustes, setAjustes] = useState(() => {
    const saved = localStorage.getItem('psico_ajustes')
    if (saved) return JSON.parse(saved)
    return {
      sonidos: true,
      modoOscuro: false,
      guardarTrans: true
    }
  })

  const handleAjusteChange = (key: string, value: boolean) => {
    setAjustes((prev: any) => ({ ...prev, [key]: value }))
  }

  const guardarAjustes = () => {
    localStorage.setItem('psico_ajustes', JSON.stringify(ajustes))
    alert('✅ Ajustes guardados correctamente.')
    closeModal()
  }

  const handleNotasChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNotas(val)
    localStorage.setItem('psico_notas', val)
  }

  const handleActionClick = async (accion: string) => {
    setActiveModal(accion)

    if (accion === 'Historial de Sesiones' && usuario?.id) {
      setCargandoHistorial(true)
      try {
        const response = await conversacionService.obtenerConversaciones(usuario.id)
        // Check if data is nested or direct array depending on interceptor
        const data = (response as any).data || response
        setHistorialSesiones(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al cargar historial:', error)
      } finally {
        setCargandoHistorial(false)
      }
    }
  }

  const closeModal = () => setActiveModal(null)

  const fetchActiveHistory = async () => {
    setCargando(true)
    try {
      const response = await conversacionService.obtenerHistorialActivo()
      const data = (response as any).data || response
      if (Array.isArray(data) && data.length > 0) {
        setMensajes(data.map(m => normalizarMensaje(m as unknown as Record<string, unknown>)))
      } else {
        // Fallback al saludo inicial si no hay historial
        setMensajes([{
          id: 0,
          content: `¡Hola, ${usuario?.nombre || 'Usuario'}! Soy tu acompañante emocional. Estoy aquí para escucharte. ¿Cómo te sientes hoy?`,
          sender: 'AI',
          associatedEmotion: null,
          createdAt: new Date().toISOString(),
        }])
      }
    } catch (error) {
      console.error('Error al cargar historial activo:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (usuario) {
      fetchActiveHistory()
    }
  }, [usuario])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const normalizarMensaje = (raw: Record<string, unknown>): Mensaje => {
    let createdAt = raw.createdAt as string | number[]
    if (Array.isArray(createdAt)) {
      const [y, m, d, h = 0, min = 0, s = 0] = createdAt as number[]
      createdAt = new Date(y, m - 1, d, h, min, s).toISOString()
    }
    return {
      id: raw.id as number,
      content: (raw.content ?? raw.contenido ?? '') as string,
      sender: (raw.sender ?? raw.remitente ?? 'AI') as 'AI' | 'USER',
      associatedEmotion: (raw.associatedEmotion ?? raw.emocionAsociada ?? null) as Mensaje['associatedEmotion'],
      createdAt: (createdAt as string) || new Date().toISOString(),
    }
  }

  const enviarMensaje = async (contenido: string) => {
    if (!usuario?.id) return

    const msgUsuario: Mensaje = {
      id: Date.now(),
      content: contenido,
      sender: 'USER',
      associatedEmotion: emocionActual?.tipo || 'NEUTRAL',
      createdAt: new Date().toISOString(),
    }
    setMensajes(prev => [...prev, msgUsuario])
    setCargando(true)

    try {
      // ── Llamar al backend que orquesta la IA, memoria y riesgo ──────────────────────────
      const response = await conversacionService.enviarMensaje(usuario.id, contenido, emocionActual?.tipo || 'NEUTRAL');
      const data = (response as any).data || response;
      const msgIA = normalizarMensaje(data as unknown as Record<string, unknown>);
      
      setMensajes(prev => [...prev, msgIA])

    } catch (error) {
      console.error('Error al enviar mensaje a IA:', error)
      setMensajes(prev => [...prev, {
        id: Date.now() + 1,
        content: 'Lo siento, hubo un problema al procesar tu mensaje. ¿Puedes intentarlo de nuevo?',
        sender: 'AI',
        associatedEmotion: null,
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="light-cw-root">
      {/* Header Light */}
      <header className="light-cw-header">
        <div className="light-cw-header-left">
          <div className="light-cw-avatar-circle">IA</div>
          <div className="light-cw-header-info">
            <h2>Psicólogo Virtual</h2>
            <p><span className="status-dot-green"></span> En línea · Sesión activa</p>
          </div>
        </div>
        <div className="light-cw-header-actions">
          <button className="light-header-btn" title="Notas" onClick={() => handleActionClick('Notas Clínicas')}>📄</button>
          <button className="light-header-btn" title="Historial" onClick={() => handleActionClick('Historial de Sesiones')}>📋</button>
          <button className="light-header-btn" title="Ajustes" onClick={() => handleActionClick('Ajustes del Asistente')}>⚙️</button>
        </div>
      </header>

      {/* Timeline Divider */}
      <div className="light-timeline-divider">
        <span>HOY · SESIÓN N° 4</span>
      </div>

      {/* Messages */}
      <div className="light-cw-messages">
        {mensajes.map(msg => (
          <ChatBubble key={msg.id} mensaje={msg} />
        ))}

        {cargando && (
          <div className="light-typing-indicator">
            <div className="light-avatar light-avatar-ai">IA</div>
            <div className="light-typing-bubble">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer / Input Area */}
      <footer className="light-cw-footer">
        <ChatInput onEnviar={enviarMensaje} cargando={cargando} />
      </footer>

      {/* Modal for Header Actions */}
      {activeModal && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h3>{activeModal}</h3>
              <button onClick={closeModal} className="close-modal-btn">✖</button>
            </div>
            <div className="custom-modal-body">
              {activeModal === 'Notas Clínicas' && (
                <textarea
                  className="modal-textarea"
                  placeholder="Escribe tus notas personales de la sesión aquí... Se guardarán automáticamente en tu dispositivo."
                  rows={8}
                  value={notas}
                  onChange={handleNotasChange}
                />
              )}
              {activeModal === 'Historial de Sesiones' && (
                <div className="modal-history-container">
                  {cargandoHistorial ? (
                    <p className="modal-history-message">Cargando sesiones...</p>
                  ) : historialSesiones.length > 0 ? (
                    <ul className="modal-history-list">
                      {historialSesiones.map((conv, index) => (
                        <li key={conv.id || index}>
                          <span className="hist-date">
                            {conv.createdAt ? new Date(conv.createdAt).toLocaleDateString() : 'Anterior'}
                          </span>
                          <strong>Sesión {conv.id}</strong>
                          {conv.active ? ' - En progreso' : ' - Finalizada'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="modal-history-message">
                      Aún no tienes sesiones guardadas. Esta es tu primera sesión.
                    </p>
                  )}
                </div>
              )}
              {activeModal === 'Ajustes del Asistente' && (
                <div className="modal-settings">
                  <label className="setting-label">
                    <input 
                      type="checkbox" 
                      checked={ajustes.sonidos} 
                      onChange={e => handleAjusteChange('sonidos', e.target.checked)} 
                    /> 
                    Activar sonidos de notificación
                  </label>
                  <label className="setting-label">
                    <input 
                      type="checkbox" 
                      checked={ajustes.modoOscuro} 
                      onChange={e => handleAjusteChange('modoOscuro', e.target.checked)} 
                    /> 
                    Modo oscuro (Próximamente)
                  </label>
                  <label className="setting-label">
                    <input 
                      type="checkbox" 
                      checked={ajustes.guardarTrans} 
                      onChange={e => handleAjusteChange('guardarTrans', e.target.checked)} 
                    /> 
                    Guardar transcripciones automáticamente
                  </label>
                  <button className="save-settings-btn" onClick={guardarAjustes}>Guardar Ajustes</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
