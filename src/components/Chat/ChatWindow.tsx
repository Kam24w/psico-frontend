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

  // Estado para visualizar mensajes de sesiones pasadas
  const [sesionSeleccionada, setSesionSeleccionada] = useState<Conversacion | null>(null)
  const [mensajesSesion, setMensajesSesion] = useState<Mensaje[]>([])
  const [cargandoMensajesSesion, setCargandoMensajesSesion] = useState(false)

  // Estado para nueva sesión (confirmación)
  const [confirmandoNuevaSesion, setConfirmandoNuevaSesion] = useState(false)

  const [ajustes, setAjustes] = useState(() => {
    const saved = localStorage.getItem('psico_ajustes')
    if (saved) return JSON.parse(saved)
    return {
      sonidos: true,
      modoOscuro: false,
      guardarTrans: true
    }
  })

  // Aplicar modo oscuro al wrapper padre al cambiar ajuste
  useEffect(() => {
    const root = document.querySelector('.chat-main-light') as HTMLElement | null
    if (root) {
      if (ajustes.modoOscuro) {
        root.classList.add('dark-mode')
      } else {
        root.classList.remove('dark-mode')
      }
    }
  }, [ajustes.modoOscuro])

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
    setSesionSeleccionada(null)
    setMensajesSesion([])
    setActiveModal(accion)

    if (accion === 'Historial de Sesiones' && usuario?.id) {
      setCargandoHistorial(true)
      try {
        const response = await conversacionService.obtenerConversaciones(usuario.id)
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
    setMensajesSesion([])
    setConfirmandoNuevaSesion(false)
  }

  // ── Abrir sesión pasada para ver sus mensajes ──────────────────────────
  const verMensajesDeSesion = async (sesion: Conversacion) => {
    setSesionSeleccionada(sesion)
    setCargandoMensajesSesion(true)
    try {
      const response = await conversacionService.obtenerMensajesSesion(sesion.id)
      const data = (response as any).data || response
      setMensajesSesion(Array.isArray(data) ? data.map((m: any) => normalizarMensaje(m)) : [])
    } catch (error) {
      console.error('Error al cargar mensajes de sesión:', error)
    } finally {
      setCargandoMensajesSesion(false)
    }
  }

  // ── Eliminar sesión del historial ──────────────────────────────────────
  const eliminarSesion = async (sesion: Conversacion, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar esta sesión del ${sesion.createdAt ? new Date(sesion.createdAt).toLocaleDateString() : 'historial'} permanentemente?`)) return
    try {
      await conversacionService.eliminarSesion(sesion.id)
      setHistorialSesiones(prev => prev.filter(s => s.id !== sesion.id))
      if (sesionSeleccionada?.id === sesion.id) {
        setSesionSeleccionada(null)
        setMensajesSesion([])
      }
    } catch (error) {
      console.error('Error al eliminar sesión:', error)
      alert('No se pudo eliminar la sesión. Inténtalo de nuevo.')
    }
  }

  // ── Nueva sesión ───────────────────────────────────────────────────────
  const iniciarNuevaSesion = async () => {
    if (!usuario?.id) return
    try {
      await conversacionService.cerrarSesionActiva(usuario.id, 'TEXTO')
    } catch (err) {
      // Si no hay sesión activa, no pasa nada
      console.warn('No había sesión activa para cerrar')
    }
    // Limpiar mensajes y mostrar saludo inicial
    setMensajes([{
      id: 0,
      content: `¡Nueva sesión iniciada! Soy tu acompañante emocional. Estoy aquí para escucharte. ¿Cómo te sientes hoy, ${usuario?.nombre || 'Usuario'}?`,
      sender: 'AI',
      associatedEmotion: null,
      createdAt: new Date().toISOString(),
    }])
    setConfirmandoNuevaSesion(false)
  }

  const fetchActiveHistory = async () => {
    setCargando(true)
    try {
      // Filtrar solo historial de sesiones de tipo TEXTO
      const response = await conversacionService.obtenerHistorialActivo('TEXTO')
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
      // Siempre enviar con tipo TEXTO para el chat escrito
      const response = await conversacionService.enviarMensaje(usuario.id, contenido, emocionActual?.tipo || 'NEUTRAL', 'TEXTO');
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

  // ── Helper de formato ──────────────────────────────────────────────────
  const formatearFechaSesion = (conv: Conversacion) => {
    try {
      return new Date(conv.createdAt).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    } catch {
      return 'Fecha desconocida'
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
          <button
            className="light-header-btn new-session-btn"
            title="Nueva Sesión"
            onClick={() => setConfirmandoNuevaSesion(true)}
          >
            ➕
          </button>
          <button className="light-header-btn" title="Notas" onClick={() => handleActionClick('Notas Clínicas')}>📄</button>
          <button className="light-header-btn" title="Historial" onClick={() => handleActionClick('Historial de Sesiones')}>📋</button>
          <button className="light-header-btn" title="Ajustes" onClick={() => handleActionClick('Ajustes del Asistente')}>⚙️</button>
        </div>
      </header>

      {/* Timeline Divider */}
      <div className="light-timeline-divider">
        <span>HOY · SESIÓN ACTIVA</span>
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

      {/* ── Confirmación Nueva Sesión ─────────────────────────────────────── */}
      {confirmandoNuevaSesion && (
        <div className="custom-modal-overlay" onClick={() => setConfirmandoNuevaSesion(false)}>
          <div className="custom-modal-content glass-modal" onClick={e => e.stopPropagation()}>
            <div className="custom-modal-header glass-modal-header">
              <h3>➕ Nueva Sesión</h3>
              <button onClick={() => setConfirmandoNuevaSesion(false)} className="close-modal-btn">✖</button>
            </div>
            <div className="custom-modal-body glass-modal-body">
              <p style={{ color: 'rgba(196,181,253,0.9)', marginBottom: '20px', lineHeight: 1.6 }}>
                La sesión actual se guardará en tu historial y comenzarás desde cero. ¿Deseas continuar?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="save-settings-btn"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                  onClick={iniciarNuevaSesion}
                >
                  Sí, comenzar nueva sesión
                </button>
                <button
                  className="save-settings-btn"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                  onClick={() => setConfirmandoNuevaSesion(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Principal ─────────────────────────────────────────────────── */}
      {activeModal && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal-content glass-modal" onClick={e => e.stopPropagation()}>
            <div className="custom-modal-header glass-modal-header">
              <h3>{activeModal}</h3>
              <button onClick={closeModal} className="close-modal-btn">✖</button>
            </div>
            <div className="custom-modal-body glass-modal-body">

              {/* ── Notas Clínicas ─────────────────── */}
              {activeModal === 'Notas Clínicas' && (
                <textarea
                  className="modal-textarea glass-textarea"
                  placeholder="Escribe tus notas personales de la sesión aquí... Se guardarán automáticamente en tu dispositivo."
                  rows={8}
                  value={notas}
                  onChange={handleNotasChange}
                />
              )}

              {/* ── Historial de Sesiones ──────────── */}
              {activeModal === 'Historial de Sesiones' && (
                <div className="modal-history-container">
                  {/* Vista de mensajes de sesión seleccionada */}
                  {sesionSeleccionada ? (
                    <div className="hist-session-detail">
                      <button
                        className="hist-back-btn"
                        onClick={() => { setSesionSeleccionada(null); setMensajesSesion([]) }}
                      >
                        ← Volver al historial
                      </button>
                      <div className="hist-session-detail-header">
                        <span className={`hist-tipo-badge ${sesionSeleccionada.tipo === 'VIDEO' ? 'badge-video' : 'badge-texto'}`}>
                          {sesionSeleccionada.tipo === 'VIDEO' ? '🎥 VIDEO' : '💬 TEXTO'}
                        </span>
                        <span className="hist-detail-date">
                          {formatearFechaSesion(sesionSeleccionada)}
                        </span>
                        <span className="hist-detail-count">{sesionSeleccionada.messageCount} mensajes</span>
                      </div>
                      {cargandoMensajesSesion ? (
                        <p className="modal-history-message">Cargando mensajes...</p>
                      ) : mensajesSesion.length > 0 ? (
                        <div className="hist-messages-list">
                          {mensajesSesion.map((msg, i) => (
                            <div key={msg.id || i} className={`hist-msg-item ${msg.sender === 'USER' ? 'hist-msg-user' : 'hist-msg-ai'}`}>
                              <span className="hist-msg-sender">{msg.sender === 'USER' ? 'Tú' : 'IA'}</span>
                              <p className="hist-msg-text">{msg.content}</p>
                              <span className="hist-msg-time">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="modal-history-message">Esta sesión no tiene mensajes guardados.</p>
                      )}
                    </div>
                  ) : (
                    /* Lista de sesiones */
                    cargandoHistorial ? (
                      <div className="hist-loading">
                        <div className="hist-spinner"></div>
                        <p>Cargando sesiones...</p>
                      </div>
                    ) : historialSesiones.length > 0 ? (
                      <>
                        <p className="hist-subtitle">{historialSesiones.length} sesiones guardadas</p>
                        <ul className="modal-history-list glass-history-list">
                          {historialSesiones.map((conv, index) => (
                            <li
                              key={conv.id || index}
                              className="glass-history-item"
                              onClick={() => verMensajesDeSesion(conv)}
                            >
                              <div className="hist-item-left">
                                <span className={`hist-tipo-badge ${conv.tipo === 'VIDEO' ? 'badge-video' : 'badge-texto'}`}>
                                  {conv.tipo === 'VIDEO' ? '🎥' : '💬'}
                                </span>
                                <div className="hist-item-info">
                                  <span className="hist-item-date">{formatearFechaSesion(conv)}</span>
                                  <span className="hist-item-meta">
                                    {conv.messageCount} mensaje{conv.messageCount !== 1 ? 's' : ''} ·{' '}
                                    <span className={`hist-status ${conv.active ? 'status-active' : 'status-done'}`}>
                                      {conv.active ? 'En progreso' : 'Finalizada'}
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <div className="hist-item-right">
                                <span className="hist-chevron">›</span>
                                <button
                                  className="delete-session-btn"
                                  title="Eliminar sesión"
                                  onClick={(e) => eliminarSesion(conv, e)}
                                >
                                  🗑️
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <div className="hist-empty">
                        <span className="hist-empty-icon">📭</span>
                        <p>Aún no tienes sesiones guardadas.</p>
                        <p>Esta es tu primera sesión.</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* ── Ajustes del Asistente ──────────── */}
              {activeModal === 'Ajustes del Asistente' && (
                <div className="modal-settings">
                  <label className="setting-label glass-setting-label">
                    <input
                      type="checkbox"
                      checked={ajustes.sonidos}
                      onChange={e => handleAjusteChange('sonidos', e.target.checked)}
                    />
                    Activar sonidos de notificación
                  </label>
                  <label className="setting-label glass-setting-label">
                    <input
                      type="checkbox"
                      checked={ajustes.modoOscuro}
                      onChange={e => handleAjusteChange('modoOscuro', e.target.checked)}
                    />
                    Modo oscuro
                  </label>
                  <label className="setting-label glass-setting-label">
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
