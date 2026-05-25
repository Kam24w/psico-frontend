import { useState, useEffect, useRef } from 'react'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import { conversationService } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { DetectedEmotion, Message, Conversation } from '../../types/domain'

interface ChatWindowProps {
  currentEmotion: DetectedEmotion;
  emocionActual?: DetectedEmotion; // Compatibility alias
}

export default function ChatWindow({ currentEmotion, emocionActual }: ChatWindowProps) {
  const { user } = useAuth()
  const activeEmotion = currentEmotion || emocionActual;
  
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [sessionHistory, setSessionHistory] = useState<Conversation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [notes, setNotes] = useState(() => localStorage.getItem('psico_notas') || '')

  // State to view messages of past sessions
  const [selectedSession, setSelectedSession] = useState<Conversation | null>(null)
  const [sessionMessages, setSessionMessages] = useState<Message[]>([])
  const [loadingSessionMessages, setLoadingSessionMessages] = useState(false)

  // State for new session confirmation modal
  const [confirmingNewSession, setConfirmingNewSession] = useState(false)

  const { showToast, showConfirm } = useToast()

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('psico_ajustes')
    if (saved) return JSON.parse(saved)
    return {
      sonidos: true,
      modoOscuro: false,
      guardarTrans: true
    }
  })

  // Apply dark mode styling to root container
  useEffect(() => {
    const root = document.querySelector('.chat-main-light') as HTMLElement | null
    if (root) {
      if (settings.modoOscuro) {
        root.classList.add('dark-mode')
      } else {
        root.classList.remove('dark-mode')
      }
    }
  }, [settings.modoOscuro])

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  const saveSettings = () => {
    localStorage.setItem('psico_ajustes', JSON.stringify(settings))
    showToast('Ajustes guardados correctamente.', 'success')
    closeModal()
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setNotes(val)
    localStorage.setItem('psico_notas', val)
  }

  const handleActionClick = async (action: string) => {
    setSelectedSession(null)
    setSessionMessages([])
    setActiveModal(action)

    if (action === 'Historial de Sesiones' && user?.id) {
      setLoadingHistory(true)
      try {
        const response = await conversationService.getConversations(user.id)
        const data = (response as any).data || response
        setSessionHistory(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al cargar historial:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedSession(null)
    setSessionMessages([])
    setConfirmingNewSession(false)
  }

  // ── Open past session to view its messages ──────────────────────────
  const viewSessionMessages = async (session: Conversation) => {
    setSelectedSession(session)
    setLoadingSessionMessages(true)
    try {
      const response = await conversationService.getSessionMessages(session.id)
      const data = (response as any).data || response
      setSessionMessages(Array.isArray(data) ? data.map((m: any) => normalizeMessage(m)) : [])
    } catch (error) {
      console.error('Error al cargar mensajes de sesión:', error)
    } finally {
      setLoadingSessionMessages(false)
    }
  }

  // ── Delete session from history ──────────────────────────────────────
  const deleteSession = (session: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    const dateStr = session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'historial';
    
    showConfirm(`¿Eliminar esta sesión del ${dateStr} permanentemente?`, async () => {
      try {
        await conversationService.deleteSession(session.id)
        setSessionHistory(prev => prev.filter(s => s.id !== session.id))
        if (selectedSession?.id === session.id) {
          setSelectedSession(null)
          setSessionMessages([])
        }
        showToast('Sesión eliminada permanentemente', 'success')
      } catch (error) {
        console.error('Error al eliminar sesión:', error)
        showToast('No se pudo eliminar la sesión. Inténtalo de nuevo.', 'error')
      }
    });
  }

  // ── New Session ───────────────────────────────────────────────────────
  const startNewSession = async () => {
    if (!user?.id) return
    try {
      await conversationService.closeActiveSession(user.id, 'TEXTO')
    } catch (err) {
      console.warn('No había sesión activa para cerrar')
    }
    // Clear messages and show initial greeting
    setMessages([{
      id: 0,
      content: `¡Nueva sesión iniciada! Soy tu acompañante emocional. Estoy aquí para escucharte. ¿Cómo te sientes hoy, ${user?.name || 'Usuario'}?`,
      sender: 'AI',
      associatedEmotion: null,
      createdAt: new Date().toISOString(),
    }])
    setConfirmingNewSession(false)
  }

  const fetchActiveHistory = async () => {
    setLoading(true)
    try {
      const response = await conversationService.getActiveHistory('TEXTO')
      const data = (response as any).data || response
      if (Array.isArray(data) && data.length > 0) {
        setMessages(data.map(m => normalizeMessage(m as unknown as Record<string, unknown>)))
      } else {
        // Fallback initial greeting
        setMessages([{
          id: 0,
          content: `¡Hola, ${user?.name || 'Usuario'}! Soy tu acompañante emocional. Estoy aquí para escucharte. ¿Cómo te sientes hoy?`,
          sender: 'AI',
          associatedEmotion: null,
          createdAt: new Date().toISOString(),
        }])
      }
    } catch (error) {
      console.error('Error al cargar historial activo:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchActiveHistory()
    }
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const normalizeMessage = (raw: Record<string, unknown>): Message => {
    let createdAt = raw.createdAt as string | number[]
    if (Array.isArray(createdAt)) {
      const [y, m, d, h = 0, min = 0, s = 0] = createdAt as number[]
      createdAt = new Date(y, m - 1, d, h, min, s).toISOString()
    }
    return {
      id: raw.id as number,
      content: (raw.content ?? raw.contenido ?? '') as string,
      sender: (raw.sender ?? raw.remitente ?? 'AI') as 'AI' | 'USER',
      associatedEmotion: (raw.associatedEmotion ?? raw.emocionAsociada ?? null) as Message['associatedEmotion'],
      createdAt: (createdAt as string) || new Date().toISOString(),
    }
  }

  const sendMessage = async (content: string) => {
    if (!user?.id) return

    const emotionType = activeEmotion?.type || 'NEUTRAL'

    const userMsg: Message = {
      id: Date.now(),
      content,
      sender: 'USER',
      associatedEmotion: emotionType,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await conversationService.sendMessage(user.id, content, emotionType, 'TEXTO');
      const data = (response as any).data || response;
      const aiMsg = normalizeMessage(data as unknown as Record<string, unknown>);

      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      console.error('Error al enviar mensaje a IA:', error)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: 'Lo siento, hubo un problema al procesar tu mensaje. ¿Puedes intentarlo de nuevo?',
        sender: 'AI',
        associatedEmotion: null,
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  // ── Date Formatting Helper ──────────────────────────────────────────────────
  const formatSessionDate = (conv: Conversation) => {
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
          <img
            className="light-cw-avatar-circle"
            src="/Logo.png"
            alt="MindSee"
            style={{ objectFit: 'cover', border: '1px solid rgba(0,0,0,0.05)' }}
          />
          <div className="light-cw-header-info">
            <h2>MindSee</h2>
            <p><span className="status-dot-green"></span> En línea · Sesión activa</p>
          </div>
        </div>
        <div className="light-cw-header-actions">
          <button
            className="light-header-btn new-session-btn"
            title="Nueva Sesión"
            onClick={() => setConfirmingNewSession(true)}
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
        {messages.map(msg => (
          <ChatBubble key={msg.id} mensaje={msg} />
        ))}

        {loading && (
          <div className="light-typing-indicator">
            <img
              className="light-avatar light-avatar-ai"
              src="/Logo.png"
              alt="MindSee"
              style={{ objectFit: 'cover' }}
            />
            <div className="light-typing-bubble">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer / Input Area */}
      <footer className="light-cw-footer">
        <ChatInput onEnviar={sendMessage} cargando={loading} />
      </footer>

      {/* ── Confirmación Nueva Sesión ─────────────────────────────────────── */}
      {confirmingNewSession && (
        <div className="custom-modal-overlay" onClick={() => setConfirmingNewSession(false)}>
          <div className="custom-modal-content glass-modal" onClick={e => e.stopPropagation()}>
            <div className="custom-modal-header glass-modal-header">
              <h3>➕ Nueva Sesión</h3>
              <button onClick={() => setConfirmingNewSession(false)} className="close-modal-btn">✖</button>
            </div>
            <div className="custom-modal-body glass-modal-body">
              <p style={{ color: 'rgba(196,181,253,0.9)', marginBottom: '20px', lineHeight: 1.6 }}>
                La sesión actual se guardará en tu historial y comenzarás desde cero. ¿Deseas continuar?
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="save-settings-btn"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                  onClick={startNewSession}
                >
                  Sí, comenzar nueva sesión
                </button>
                <button
                  className="save-settings-btn"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                  onClick={() => setConfirmingNewSession(false)}
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
                  value={notes}
                  onChange={handleNotesChange}
                />
              )}

              {/* ── Historial de Sesiones ──────────── */}
              {activeModal === 'Historial de Sesiones' && (
                <div className="modal-history-container">
                  {/* Vista de mensajes de sesión seleccionada */}
                  {selectedSession ? (
                    <div className="hist-session-detail">
                      <button
                        className="hist-back-btn"
                        onClick={() => { setSelectedSession(null); setSessionMessages([]) }}
                      >
                        ← Volver al historial
                      </button>
                      <div className="hist-session-detail-header">
                        <span className={`hist-tipo-badge ${selectedSession.type === 'VIDEO' ? 'badge-video' : 'badge-texto'}`}>
                          {selectedSession.type === 'VIDEO' ? '🎥 VIDEO' : '💬 TEXTO'}
                        </span>
                        <span className="hist-detail-date">
                          {formatSessionDate(selectedSession)}
                        </span>
                        <span className="hist-detail-count">{selectedSession.messageCount} mensajes</span>
                      </div>
                      {loadingSessionMessages ? (
                        <p className="modal-history-message">Cargando mensajes...</p>
                      ) : sessionMessages.length > 0 ? (
                        <div className="hist-messages-list">
                          {sessionMessages.map((msg, i) => (
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
                    loadingHistory ? (
                      <div className="hist-loading">
                        <div className="hist-spinner"></div>
                        <p>Cargando sesiones...</p>
                      </div>
                    ) : sessionHistory.length > 0 ? (
                      <>
                        <p className="hist-subtitle">{sessionHistory.length} sesiones guardadas</p>
                        <ul className="modal-history-list glass-history-list">
                           {sessionHistory.map((conv, index) => (
                            <li
                              key={conv.id || index}
                              className="glass-history-item"
                              onClick={() => viewSessionMessages(conv)}
                            >
                              <div className="hist-item-left">
                                <span className={`hist-tipo-badge ${conv.type === 'VIDEO' ? 'badge-video' : 'badge-texto'}`}>
                                  {conv.type === 'VIDEO' ? '🎥' : '💬'}
                                </span>
                                <div className="hist-item-info">
                                  <span className="hist-item-date">{formatSessionDate(conv)}</span>
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
                                  onClick={(e) => deleteSession(conv, e)}
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
                      checked={settings.sonidos}
                      onChange={e => handleSettingChange('sonidos', e.target.checked)}
                    />
                    Activar sonidos de notificación
                  </label>
                  <label className="setting-label glass-setting-label">
                    <input
                      type="checkbox"
                      checked={settings.modoOscuro}
                      onChange={e => handleSettingChange('modoOscuro', e.target.checked)}
                    />
                    Modo oscuro
                  </label>
                  <label className="setting-label glass-setting-label">
                    <input
                      type="checkbox"
                      checked={settings.guardarTrans}
                      onChange={e => handleSettingChange('guardarTrans', e.target.checked)}
                    />
                    Guardar transcripciones automáticamente
                  </label>
                  <button className="save-settings-btn" onClick={saveSettings}>Guardar Ajustes</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
