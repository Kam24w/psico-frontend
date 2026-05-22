import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEmotionDetector } from '../hooks/useEmotionDetector'
import { conversacionService } from '../services/api'
import type { TipoEmocion } from '../types/domain'

type ConversationMode = 'push-to-talk' | 'free'

export default function CallPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)

  // ── Emotion Detection Hook (NO TOCAR — funciona bien) ─────────────────────
  const { emocionActual, modelosCargados, errorCamara } = useEmotionDetector(videoRef)

  // ── Estados de UI ─────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [aiStatus, setAiStatus] = useState<'esperando' | 'pensando' | 'hablando'>('esperando')
  const [lastAiMessage, setLastAiMessage] = useState('')
  const [sessionStarted, setSessionStarted] = useState(false)
  const [conversationMode, setConversationMode] = useState<ConversationMode>('free')
  const [isListening, setIsListening] = useState(false)

  // ── Refs de lifecycle del componente ──────────────────────────────────────
  const isMountedRef   = useRef(true)
  const hasInitiatedRef = useRef(false)
  const emotionTimeoutRef = useRef<any>(null)

  // ── FUENTE ÚNICA DE VERDAD: guardias internas de estado de voz ────────────
  // Se usan useRef (no useState) porque son guardias internas que NO necesitan
  // disparar re-renders. Su único rol es prevenir race conditions.
  const recognitionRef  = useRef<any>(null)
  const isListeningRef  = useRef(false)   // ¿SpeechRecognition está activo AHORA MISMO?
  const isProcessingRef = useRef(false)   // ¿Hay una petición al backend en vuelo?
  const isMutedRef      = useRef(false)   // Espejo ref de isMuted para closures sin stale state
  const conversationModeRef = useRef<ConversationMode>('free')

  // Sincronizar isMutedRef con el estado React
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  // Sincronizar conversationModeRef con el estado React
  useEffect(() => {
    conversationModeRef.current = conversationMode
  }, [conversationMode])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // ── CONTROL CENTRALIZADO: único punto que puede encender el micrófono ─────
  const startListening = useCallback(() => {
    if (!recognitionRef.current)       { console.log('[VOZ] MIC_BLOCKED: no hay instancia de recognition'); return }
    if (isMutedRef.current)            { console.log('[VOZ] MIC_BLOCKED_MUTED'); return }
    if (isListeningRef.current)        { console.log('[VOZ] MIC_ALREADY_ACTIVE: evitando doble start()'); return }
    if (isProcessingRef.current)       { console.log('[VOZ] MIC_BLOCKED_PROCESSING: backend request en vuelo'); return }
    if (!isMountedRef.current)         { console.log('[VOZ] MIC_BLOCKED: componente desmontado'); return }

    try {
      recognitionRef.current.start()
      isListeningRef.current = true
      setIsListening(true)
      console.log('[VOZ] MIC_STARTED')
    } catch (e: any) {
      // InvalidStateError: ya estaba activo (seguridad extra)
      console.warn('[VOZ] MIC_START_ERROR:', e?.message)
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [])

  // ── CONTROL CENTRALIZADO: único punto que puede apagar el micrófono ───────
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return
    try {
      recognitionRef.current.stop()
      isListeningRef.current = false
      setIsListening(false)
      console.log('[VOZ] MIC_STOPPED')
    } catch (e: any) {
      console.warn('[VOZ] MIC_STOP_ERROR:', e?.message)
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [])

  // ── TTS (Text to Speech) ──────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!text || !isMountedRef.current) return

    // Apagar mic ANTES de que la IA hable — evita que se escuche a sí misma
    stopListening()

    setAiStatus('hablando')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 0.95

    // Selección de voz en español
    const voices = window.speechSynthesis.getVoices()
    const spanishVoice = voices.find(v => v.lang.startsWith('es'))
    if (spanishVoice) {
      utterance.voice = spanishVoice
    }

    utterance.onstart = () => {
      console.log('[VOZ] AI_STARTED_SPEAKING')
    }

    utterance.onend = () => {
      console.log('[VOZ] AI_FINISHED_SPEAKING')
      if (!isMountedRef.current) return
      setAiStatus('esperando')
      if (conversationModeRef.current === 'free') {
        console.log('[VOZ] FREE_MODE_WAITING: mic se activará en 600ms')
        setTimeout(() => {
          if (conversationModeRef.current === 'free') {
            startListening()
          }
        }, 600)
      } else {
        console.log('[VOZ] PUSH_TO_TALK_WAITING: esperando pulsación manual')
      }
    }

    utterance.onerror = (e: any) => {
      if (e.error === 'interrupted') {
        // Artefacto normal de lifecycle cuando el componente se desmonta mientras habla
        console.warn('[VOZ] SPEECH_INTERRUPTED (lifecycle artifact)')
        return
      }
      console.error('[VOZ] SPEECH_ERROR:', e.error)
      if (isMountedRef.current) {
        setAiStatus('esperando')
        if (conversationModeRef.current === 'free') {
          setTimeout(() => {
            if (conversationModeRef.current === 'free') {
              startListening()
            }
          }, 600)
        } else {
          console.log('[VOZ] PUSH_TO_TALK_WAITING (after TTS error): esperando pulsación manual')
        }
      }
    }

    console.log('[VOZ] AI_ATTEMPTING_TO_SPEAK:', text.substring(0, 50) + '...')
    window.speechSynthesis.speak(utterance)
  }, [stopListening, startListening])

  // ── STT: procesamiento de lo que dijo el usuario ──────────────────────────
  const processVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return

    isProcessingRef.current = true
    setAiStatus('pensando')
    console.log('[VOZ] PROCESSING_USER_INPUT:', text)

    try {
      // ÚNICO request a backend — sin duplicados, sin Groq directo
      const response = await conversacionService.enviarMensaje(
        usuario.id,
        text,
        emocionActual.tipo || 'NEUTRAL',
        'VIDEO'
      )
      const data = (response as any).data || response
      const respuesta = data.content || data.cleaned || (typeof data === 'string' ? data : 'Error procesando respuesta')

      console.log('[VOZ] AI_RESPONSE_RECEIVED:', respuesta.substring(0, 50) + '...')
      setLastAiMessage(respuesta)
      // speak() apagará el mic y lo reactivará cuando termine
      speak(respuesta)
      
      // Sincronizar con el backend
      if (usuario?.id) {
         try {
           await conversacionService.sincronizarMensajes(
             usuario.id,
             text,
             respuesta,
             emocionActual.tipo,
             'VIDEO'
           )
         } catch(e) { console.error('Error syncing video msg', e) }
      }
    } catch (err) {
      console.error('[VOZ] BACKEND_ERROR:', err)
      setAiStatus('esperando')
      // Reactivar mic incluso si hubo error (sólo en modo libre)
      if (conversationModeRef.current === 'free') {
        startListening()
      }
    } finally {
      isProcessingRef.current = false
    }
  }, [emocionActual, speak, startListening, usuario?.id])

  // ── Saludo inicial de la IA ────────────────────────────────────────────────
  const initiateAI = useCallback(async (detectedEmotion: TipoEmocion) => {
    if (hasInitiatedRef.current) return
    hasInitiatedRef.current = true

    setAiStatus('pensando')
    console.log('[VOZ] SESSION_INITIATED with emotion:', detectedEmotion)

    try {
      const response = await conversacionService.iniciarConversacion(detectedEmotion, 'VIDEO')
      const data = (response as any).data || response
      const saludo = data.content || data.cleaned || (typeof data === 'string' ? data : 'Hola, ¿cómo te sientes?')

      console.log('[VOZ] GREETING_RECEIVED:', saludo.substring(0, 50) + '...')
      setLastAiMessage(saludo)
      speak(saludo)
      
      // Sincronizar el saludo inicial
      if (usuario?.id) {
         try {
           await conversacionService.sincronizarMensajes(
             usuario.id,
             "El usuario acaba de iniciar la llamada.",
             saludo,
             detectedEmotion,
             'VIDEO'
           )
         } catch(e) { console.error('Error syncing video init', e) }
      }
    } catch (err) {
      console.error('[VOZ] GREETING_ERROR:', err)
      if (isMountedRef.current) {
        setAiStatus('esperando')
        // Si falló el saludo, encender mic para que el usuario pueda hablar igual (sólo en modo libre)
        if (conversationModeRef.current === 'free') {
          startListening()
        }
      }
    }
  }, [speak, startListening])

  // ── Inicialización del SpeechRecognition — UNA SOLA VEZ ──────────────────
  // Deps vacías [] = se crea una sola instancia durante toda la vida del componente.
  // Esto evita que los listeners se dupliquen y que el objeto se destruya/recree
  // con cada cambio de estado, que era uno de los problemas raíz del código anterior.
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('[VOZ] SpeechRecognition no está soportado en este navegador')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'es-ES'

    recognition.onstart = () => {
      isListeningRef.current = true
      setIsListening(true)
      console.log('[VOZ] MIC_STARTED (confirmed by onstart)')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      console.log('[VOZ] USER_SAID:', transcript)
      try {
        recognition.stop()
      } catch (e) {}
      isListeningRef.current = false
      setIsListening(false)
      processVoiceInput(transcript)
    }

    recognition.onerror = (event: any) => {
      // 'aborted' es normal — ocurre cuando nosotros llamamos stop() explícitamente
      if (event.error === 'aborted') {
        console.log('[VOZ] MIC_ABORTED (controlled stop — OK)')
        isListeningRef.current = false
        setIsListening(false)
        return
      }
      // 'no-speech': el usuario no habló. NO reactivar aquí — se evita el loop
      if (event.error === 'no-speech') {
        console.log('[VOZ] MIC_NO_SPEECH (silence detected — waiting)')
        isListeningRef.current = false
        setIsListening(false)
        return
      }
      console.error('[VOZ] MIC_ERROR:', event.error)
      isListeningRef.current = false
      setIsListening(false)
    }

    recognition.onend = () => {
      // ⚠️ CRÍTICO: NO llamar recognition.start() aquí.
      // El auto-restart eliminado era la causa #1 de todos los loops y race conditions.
      // La reactivación del micrófono es EXCLUSIVA responsabilidad de utterance.onend
      // o de una acción directa del usuario (unmute/PTT).
      isListeningRef.current = false
      setIsListening(false)
      console.log('[VOZ] MIC_STOPPED (recognition ended)')
    }

    recognitionRef.current = recognition
    console.log('[VOZ] SpeechRecognition initialized')

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch (e) {}
        recognitionRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // ← INTENCIONALMENTE VACÍO: una sola instancia por montaje

  // ── Lógica de inicio: espera a que el usuario haga clic ───────────────────
  useEffect(() => {
    if (!sessionStarted) return
    if (modelosCargados && !hasInitiatedRef.current) {
      emotionTimeoutRef.current = setTimeout(() => {
        console.log('[VOZ] EMOTION_TIMEOUT: using NEUTRAL as fallback')
        initiateAI('NEUTRAL')
      }, 3000)
    }
    return () => {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current)
    }
  }, [sessionStarted, modelosCargados, initiateAI])

  // ── Si detectamos emoción real antes del timeout, usarla ──────────────────
  useEffect(() => {
    if (!sessionStarted) return
    if (emocionActual.tipo !== 'NEUTRAL' && !hasInitiatedRef.current && modelosCargados) {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current)
      initiateAI(emocionActual.tipo)
    }
  }, [sessionStarted, emocionActual, initiateAI, modelosCargados])

  // ── Botón Mute ────────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (!isMuted) {
      // MUTEAR: apagar el micrófono y prevenir cualquier reactivación
      stopListening()
      setIsMuted(true)
      console.log('[VOZ] SESSION_MUTED')
    } else {
      // DESMUTEAR: solo activar el mic si la IA no está hablando ni procesando, y en modo libre
      setIsMuted(false)
      console.log('[VOZ] SESSION_UNMUTED')
      if (aiStatus === 'esperando' && !isProcessingRef.current && conversationModeRef.current === 'free') {
        // Pequeño delay para que isMutedRef.current se actualice via el useEffect
        setTimeout(() => startListening(), 50)
      }
    }
  }

  const endCall = () => {
    stopListening()
    navigate('/chat')
  }

  const getHeaderSubtitle = () => {
    if (aiStatus === 'hablando') return 'La IA está hablando...'
    if (aiStatus === 'pensando') return 'Procesando tu respuesta...'
    if (isMuted) return 'Micrófono silenciado'
    
    if (conversationMode === 'free') {
      return isListening ? 'Escuchando... (Modo conversación libre)' : 'Modo conversación libre (esperando)'
    } else {
      return isListening ? 'Escuchando... (Pulsa para detener)' : 'Modo push-to-talk (Listo)'
    }
  }

  return (
    <div className="call-page">
      {!sessionStarted && (
        <div className="session-start-overlay">
          <div className="session-start-card">
            <div className="session-start-icon">🧠</div>
            <h2>¿Listo para empezar?</h2>
            <p>Selecciona tu modo de interacción preferido para comenzar la sesión.</p>
            
            <div className="mode-selection-container">
              <button 
                className={`mode-select-card ${conversationMode === 'free' ? 'active' : ''}`}
                onClick={() => {
                  setConversationMode('free')
                  conversationModeRef.current = 'free'
                }}
              >
                <span className="mode-card-icon">🗣️</span>
                <div className="mode-card-text">
                  <h3>Conversación Libre</h3>
                  <p>La IA habla y te escucha automáticamente. Ideal para una experiencia fluida.</p>
                </div>
              </button>
              
              <button 
                className={`mode-select-card ${conversationMode === 'push-to-talk' ? 'active' : ''}`}
                onClick={() => {
                  setConversationMode('push-to-talk')
                  conversationModeRef.current = 'push-to-talk'
                }}
              >
                <span className="mode-card-icon">🎤</span>
                <div className="mode-card-text">
                  <h3>Push-To-Talk</h3>
                  <p>Controla el micrófono manualmente. Evita ruidos y es ultra estable.</p>
                </div>
              </button>
            </div>

            <button className="session-start-btn" onClick={() => {
              setSessionStarted(true)
              setTimeout(() => {
                if (modelosCargados) initiateAI(emocionActual.tipo)
              }, 100)
            }}>
              Comenzar Sesión 📞
            </button>
          </div>
        </div>
      )}
      <div className="global-blob-1" />
      <div className="global-blob-2" />
      <div className="global-blob-3" />

      <div className="call-header">
        <h2 className="call-header-title">Sesión de Voz</h2>
        <p className="call-header-subtitle">
          {getHeaderSubtitle()}
        </p>
      </div>

      <div className={`call-video-wrapper ${aiStatus === 'hablando' ? 'pulsing-aura' : ''}`}>
        {isCameraOff ? (
          <div className="call-video-off-placeholder">
            <span className="call-video-off-icon">👤</span>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="call-video-circle"
            autoPlay
            playsInline
            muted
          />
        )}

        <div className="call-emotion-badge">
          {emocionActual.tipo}
        </div>
      </div>

      <div className="call-action-area">
        {lastAiMessage && (
          <div className="call-ai-subtitle">
            "{lastAiMessage}"
          </div>
        )}

        {conversationMode === 'push-to-talk' && sessionStarted && (
          <div className="call-ptt-container">
            <button
              className={`call-ptt-btn ${isListening ? 'listening' : ''} ${(aiStatus !== 'esperando' || isMuted) ? 'disabled' : ''}`}
              onClick={() => {
                if (aiStatus !== 'esperando' || isMuted) return
                if (isListening) {
                  stopListening()
                } else {
                  startListening()
                }
              }}
              disabled={aiStatus !== 'esperando' || isMuted}
            >
              <span className="ptt-icon">🎤</span>
              <span className="ptt-text">
                {isListening ? 'Escuchando... Pulsa para enviar' : 'Presiona para Hablar'}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="call-dock">
        <button
          className={`call-dock-btn ${isMuted ? 'muted' : ''}`}
          onClick={toggleMute}
          title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
        >
          <span className="btn-icon">{isMuted ? '🔇' : '🎙️'}</span>
        </button>

        <button
          className={`call-dock-btn secondary-action ${conversationMode === 'free' ? 'active-mode' : ''}`}
          onClick={() => {
            const newMode = conversationMode === 'free' ? 'push-to-talk' : 'free'
            setConversationMode(newMode)
            conversationModeRef.current = newMode
            console.log(`[VOZ] MODE_CHANGED: ${newMode}`)
            
            if (newMode === 'push-to-talk') {
              stopListening()
            } else {
              if (aiStatus === 'esperando' && !isProcessingRef.current) {
                startListening()
              }
            }
          }}
          title={conversationMode === 'free' ? "Cambiar a modo Push-To-Talk" : "Cambiar a modo Conversación Libre"}
        >
          <span className="btn-icon">{conversationMode === 'free' ? '🗣️' : '🎤'}</span>
          <span className="btn-text">
            {conversationMode === 'free' ? 'Modo Libre' : 'Modo PTT'}
          </span>
        </button>

        <button
          className="call-dock-btn secondary-action"
          onClick={() => navigate('/chat')}
        >
          <span className="btn-icon">💬</span>
          <span className="btn-text">Chat de Texto</span>
        </button>

        <button
          className="call-dock-btn end-call"
          onClick={endCall}
        >
          <span className="btn-icon">✖</span>
          <span className="btn-text">Finalizar</span>
        </button>
      </div>
    </div>
  )
}
