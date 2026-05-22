import { useState, useEffect, useRef } from 'react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import { conversacionService } from '../../services/api'
import { enviarMensajeIA } from '../../services/groqService'
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
  const [sesionSeleccionada, setSesionSeleccionada] = useState<number | null>(null)
  const [mensajesHistorial, setMensajesHistorial] = useState<Mensaje[]>([])
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

    if (accion === 'Nueva Sesión' && usuario?.id) {
      if (confirm('¿Estás seguro de que quieres iniciar una nueva sesión? El chat actual se cerrará y se guardará en el historial.')) {
        try {
          await conversacionService.cerrarSesionActiva(usuario.id, 'TEXTO')
          // Fetch again, which will start a new session
          fetchActiveHistory()
          setActiveModal(null)
        } catch (error) {
          console.error('Error al iniciar nueva sesión:', error)
        }
      } else {
        setActiveModal(null)
      }
      return
    }

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

  const closeModal = () => {
    setActiveModal(null)
    setSesionSeleccionada(null)
    setMensajesHistorial([])
  }

  const handleSelectSession = async (convId: number) => {
    setSesionSeleccionada(convId)
    setCargandoHistorial(true)
    try {
      const response = await conversacionService.obtenerHistorial(convId)
      const data = (response as any).data || response
      setMensajesHistorial(Array.isArray(data) ? data.map(m => normalizarMensaje(m as any)) : [])
    } catch (error) {
      console.error('Error al cargar mensajes de historial:', error)
    } finally {
      setCargandoHistorial(false)
    }
  }

  const handleDeleteSession = async (convId: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the session
    if (confirm('¿Estás seguro de que deseas eliminar esta sesión y todos sus mensajes permanentemente?')) {
      try {
        await conversacionService.eliminarSesion(convId)
        setHistorialSesiones(prev => prev.filter(c => c.id !== convId))
        if (sesionSeleccionada === convId) {
          setSesionSeleccionada(null)
        }
      } catch (error) {
        console.error('Error al eliminar sesión:', error)
      }
    }
  }

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
      // Convertir historial existente para Groq
      const historial = mensajes
        .filter(m => m.id !== 0) // ignorar mensaje inicial de saludo por defecto si es id 0
        .map(m => ({
          role: m.sender === 'USER' ? 'user' : 'assistant',
          content: m.content
        }))

      // ── IA corre en el FRONTEND (Groq API directa) ──────────────────────────
      const respuestaIA = await enviarMensajeIA(contenido, emocionActual?.tipo || 'NEUTRAL', historial)

      const msgIA: Mensaje = {
        id: Date.now() + 1,
        content: respuestaIA,
        sender: 'AI',
        associatedEmotion: emocionActual?.tipo || 'NEUTRAL',
        createdAt: new Date().toISOString(),
      }
      setMensajes(prev => [...prev, msgIA])

      // Sincronizar con el backend
      try {
        await conversacionService.sincronizarMensajes(
          usuario.id,
          contenido,
          respuestaIA,
          emocionActual?.tipo || 'NEUTRAL'
        )
      } catch (syncError) {
        console.error('Error al sincronizar mensajes con el backend:', syncError)
      }

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
    <div className={`light-cw-root ${ajustes.modoOscuro ? 'dark-mode' : ''}`}>
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
          <button className="light-header-btn" title="Nueva Sesión" onClick={() => handleActionClick('Nueva Sesión')}>➕</button>
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
                  {sesionSeleccionada ? (
                    <div className="modal-history-messages-view">
                      <button 
                        onClick={() => setSesionSeleccionada(null)} 
                        className="btn-volver-glass"
                      >
                        ⬅ Volver a sesiones
                      </button>
                      <div className="modal-messages-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                        {cargandoHistorial ? (
                           <p className="modal-history-message">Cargando mensajes...</p>
                        ) : mensajesHistorial.length > 0 ? (
                           mensajesHistorial.map(msg => (
                             <div key={msg.id} className={`modal-msg ${msg.sender === 'USER' ? 'modal-msg-user' : 'modal-msg-ai'}`}>
                               <strong style={{ color: msg.sender === 'USER' ? '#c4b5fd' : '#e2e8f0', display: 'block', marginBottom: '4px' }}>
                                 {msg.sender === 'USER' ? 'Tú' : 'IA Psicólogo'}
                               </strong>
                               <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                             </div>
                           ))
                        ) : (
                           <p className="modal-history-message">No hay mensajes en esta sesión.</p>
                        )}
                      </div>
                    </div>
                  ) : cargandoHistorial ? (
                    <p className="modal-history-message">Cargando sesiones...</p>
                  ) : historialSesiones.length > 0 ? (
                    <ul className="modal-history-list">
                      {historialSesiones.map((conv, index) => (
                        <li 
                          key={conv.id || index} 
                          className="hist-session-item"
                          onClick={() => conv.id && handleSelectSession(conv.id)}
                        >
                          <div className="hist-session-info">
                            <div className="hist-session-title">
                              Sesión {conv.id} 
                              {conv.tipo && <span className="hist-session-badge">{conv.tipo}</span>}
                              {conv.active ? <span className="hist-session-badge" style={{background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', borderColor: 'rgba(34,197,94,0.3)'}}>En progreso</span> : ''}
                            </div>
                            <span className="hist-date">
                              {conv.createdAt ? new Date(conv.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Anterior'}
                            </span>
                          </div>
                          <button 
                            className="hist-delete-btn"
                            onClick={(e) => conv.id && handleDeleteSession(conv.id, e)}
                            title="Eliminar sesión"
                          >
                            🗑️
                          </button>
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
                    Modo oscuro
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
