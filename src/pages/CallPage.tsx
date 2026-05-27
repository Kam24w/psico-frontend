import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEmotionDetector } from '../hooks/useEmotionDetector'
import { conversationService } from '../services/api'
import type { EmotionType } from '../types/domain'

type ConversationMode = 'push-to-talk' | 'free'
type AiStatus = 'waiting' | 'thinking' | 'speaking'

const EMOTION_LABELS_ES: Record<string, string> = {
  HAPPY: 'FELIZ',
  SAD: 'TRISTE',
  STRESSED: 'ESTRESADO',
  ANGRY: 'ENOJADO',
  ANXIOUS: 'ANSIOSO',
  SURPRISED: 'SORPRENDIDO',
  NEUTRAL: 'NEUTRAL',
}

export default function CallPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)

  // ── UI States (Moved up for hook dependency) ────────────────────────
  const [sessionStarted, setSessionStarted] = useState(false)

  // ── Emotion Detection Hook ─────────────────────
  const { currentEmotion, modelsLoaded, cameraError } = useEmotionDetector(videoRef, sessionStarted)

  // ── UI States ─────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [aiStatus, setAiStatus] = useState<AiStatus>('waiting')
  const [lastAiMessage, setLastAiMessage] = useState('')
  const [conversationMode, setConversationMode] = useState<ConversationMode>('free')
  const [isListening, setIsListening] = useState(false)

  // ── Lifecyle Refs ──────────────────────────────────────
  const isMountedRef   = useRef(true)
  const hasInitiatedRef = useRef(false)
  const emotionTimeoutRef = useRef<any>(null)

  // ── Voice guards and controls (useRef to prevent race conditions) ────────────
  const recognitionRef  = useRef<any>(null)
  const isListeningRef  = useRef(false)   // Is SpeechRecognition active right now?
  const isProcessingRef = useRef(false)   // Is there a backend request in flight?
  const isMutedRef      = useRef(false)   // Ref mirror of isMuted to prevent stale closures
  const conversationModeRef = useRef<ConversationMode>('free')

  const accumulatedTextRef = useRef('')

  // Sync isMutedRef with state
  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  // Sync conversationModeRef with state
  useEffect(() => {
    conversationModeRef.current = conversationMode
  }, [conversationMode])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // ── startListening ─────
  const startListening = useCallback(() => {
    if (!recognitionRef.current)       { console.log('[VOZ] MIC_BLOCKED: no recognition instance'); return }
    if (isMutedRef.current)            { console.log('[VOZ] MIC_BLOCKED_MUTED'); return }
    if (isListeningRef.current)        { console.log('[VOZ] MIC_ALREADY_ACTIVE: preventing double start()'); return }
    if (isProcessingRef.current)       { console.log('[VOZ] MIC_BLOCKED_PROCESSING: backend request in flight'); return }
    if (!isMountedRef.current)         { console.log('[VOZ] MIC_BLOCKED: component unmounted'); return }

    try {
      recognitionRef.current.continuous = conversationModeRef.current === 'push-to-talk'
      accumulatedTextRef.current = '' // Reset
      recognitionRef.current.start()
      isListeningRef.current = true
      setIsListening(true)
      console.log('[VOZ] MIC_STARTED', conversationModeRef.current)
    } catch (e: any) {
      console.warn('[VOZ] MIC_START_ERROR:', e?.message)
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [])

  // ── stopListening ───────
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return
    try {
      recognitionRef.current.stop()
      console.log('[VOZ] MIC_STOP_REQUESTED')
    } catch (e: any) {
      console.warn('[VOZ] MIC_STOP_ERROR:', e?.message)
    }
  }, [])

  // ── TTS (Text to Speech) ──────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!text || !isMountedRef.current) return

    // Turn off microphone BEFORE AI speaks to avoid listening to itself
    stopListening()

    setAiStatus('speaking')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 0.95

    // Spanish voice selection
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
      setAiStatus('waiting')
      if (conversationModeRef.current === 'free') {
        console.log('[VOZ] FREE_MODE_WAITING: mic activating in 600ms')
        setTimeout(() => {
          if (conversationModeRef.current === 'free') {
            startListening()
          }
        }, 600)
      } else {
        console.log('[VOZ] PUSH_TO_TALK_WAITING: waiting for manual press')
      }
    }

    utterance.onerror = (e: any) => {
      if (e.error === 'interrupted') {
        console.warn('[VOZ] SPEECH_INTERRUPTED')
        return
      }
      console.error('[VOZ] SPEECH_ERROR:', e.error)
      if (isMountedRef.current) {
        setAiStatus('waiting')
        if (conversationModeRef.current === 'free') {
          setTimeout(() => {
            if (conversationModeRef.current === 'free') {
              startListening()
            }
          }, 600)
        } else {
          console.log('[VOZ] PUSH_TO_TALK_WAITING')
        }
      }
    }

    console.log('[VOZ] AI_ATTEMPTING_TO_SPEAK:', text.substring(0, 50) + '...')
    window.speechSynthesis.speak(utterance)
  }, [stopListening, startListening])

  // ── STT: Process user voice input ──────────────────────────
  const processVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return

    isProcessingRef.current = true
    setAiStatus('thinking')
    console.log('[VOZ] PROCESSING_USER_INPUT:', text)

    try {
      const response = await conversationService.sendMessage(
        user.id,
        text,
        currentEmotion.type || 'NEUTRAL',
        'VIDEO'
      )
      const data = (response as any).data || response
      const reply = data.content || data.cleaned || (typeof data === 'string' ? data : 'Error procesando respuesta')

      console.log('[VOZ] AI_RESPONSE_RECEIVED:', reply.substring(0, 50) + '...')
      setLastAiMessage(reply)
      speak(reply)
    } catch (err) {
      console.error('[VOZ] BACKEND_ERROR:', err)
      setAiStatus('waiting')
      if (conversationModeRef.current === 'free') {
        startListening()
      }
    } finally {
      isProcessingRef.current = false
    }
  }, [currentEmotion, speak, startListening, user?.id])

  // ── AI Greeting ────────────────────────────────────────────────
  const initiateAI = useCallback(async (detectedEmotion: EmotionType) => {
    if (hasInitiatedRef.current) return
    hasInitiatedRef.current = true

    setAiStatus('thinking')
    console.log('[VOZ] SESSION_INITIATED with emotion:', detectedEmotion)

    try {
      const response = await conversationService.initiateConversation(detectedEmotion, 'VIDEO')
      const data = (response as any).data || response
      const greeting = data.content || data.cleaned || (typeof data === 'string' ? data : 'Hola, ¿cómo te sientes?')

      console.log('[VOZ] GREETING_RECEIVED:', greeting.substring(0, 50) + '...')
      setLastAiMessage(greeting)
      speak(greeting)
    } catch (err) {
      console.error('[VOZ] GREETING_ERROR:', err)
      if (isMountedRef.current) {
        setAiStatus('waiting')
        if (conversationModeRef.current === 'free') {
          startListening()
        }
      }
    }
  }, [speak, startListening])

  // ── Initialize SpeechRecognition ──────────────────
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('[VOZ] SpeechRecognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'es-ES'

    recognition.onstart = () => {
      isListeningRef.current = true
      setIsListening(true)
      ;(recognitionRef.current as any)._networkRetries = 0
      console.log('[VOZ] MIC_STARTED')
    }

    recognition.onresult = (event: any) => {
      let currentTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentTranscript += event.results[i][0].transcript + ' '
        }
      }
      
      currentTranscript = currentTranscript.trim()
      if (!currentTranscript) return

      if (conversationModeRef.current === 'free') {
        console.log('[VOZ] USER_SAID (Free):', currentTranscript)
        try { recognition.stop() } catch (e) {}
        processVoiceInput(currentTranscript)
      } else {
        accumulatedTextRef.current += currentTranscript + ' '
        console.log('[VOZ] ACCUMULATING (PTT):', accumulatedTextRef.current)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') {
        console.log('[VOZ] MIC_ABORTED')
        isListeningRef.current = false
        setIsListening(false)
        return
      }
      if (event.error === 'no-speech') {
        console.log('[VOZ] MIC_NO_SPEECH')
        isListeningRef.current = false
        setIsListening(false)
        return
      }
      
      console.error('[VOZ] MIC_ERROR:', event.error)
      isListeningRef.current = false
      setIsListening(false)

      if (event.error === 'network' && conversationModeRef.current === 'free' && isMountedRef.current && !isMutedRef.current && !isProcessingRef.current) {
        const currentRetries = (recognitionRef.current as any)._networkRetries || 0
        
        if (currentRetries < 2) {
          ;(recognitionRef.current as any)._networkRetries = currentRetries + 1
          console.log(`[VOZ] Retrying after network error (${currentRetries + 1}/2)...`)
          setTimeout(() => {
            if (conversationModeRef.current === 'free' && !isListeningRef.current && !isMutedRef.current && !isProcessingRef.current) {
              startListening()
            }
          }, 1500)
        } else {
          console.error('[VOZ] Permanent network error.')
          alert('Tu navegador está bloqueando la conexión al servidor de voz. Por favor usa Google Chrome, desactiva bloqueadores de anuncios o usa el Chat de Texto.')
        }
      }
    }

    recognition.onend = () => {
      isListeningRef.current = false
      setIsListening(false)
      console.log('[VOZ] MIC_STOPPED')
      
      if (conversationModeRef.current === 'push-to-talk') {
         const finalTxt = accumulatedTextRef.current.trim()
         if (finalTxt && !isProcessingRef.current) {
           console.log('[VOZ] SENDING ACCUMULATED PTT TEXT:', finalTxt)
           processVoiceInput(finalTxt)
         }
         accumulatedTextRef.current = ''
      }
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
  }, [])

  // ── Session initiation waiting logic ───────────────────
  useEffect(() => {
    if (!sessionStarted) return
    if (modelsLoaded && !hasInitiatedRef.current) {
      emotionTimeoutRef.current = setTimeout(() => {
        console.log('[VOZ] EMOTION_TIMEOUT: using NEUTRAL as fallback')
        initiateAI('NEUTRAL')
      }, 3000)
    }
    return () => {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current)
    }
  }, [sessionStarted, modelsLoaded, initiateAI])

  // ── Emotion detection callback ──────────────────
  useEffect(() => {
    if (!sessionStarted) return
    if (currentEmotion.type !== 'NEUTRAL' && !hasInitiatedRef.current && modelsLoaded) {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current)
      initiateAI(currentEmotion.type)
    }
  }, [sessionStarted, currentEmotion, initiateAI, modelsLoaded])

  // ── Mute Button ────────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (!isMuted) {
      stopListening()
      setIsMuted(true)
      console.log('[VOZ] SESSION_MUTED')
    } else {
      setIsMuted(false)
      console.log('[VOZ] SESSION_UNMUTED')
      if (aiStatus === 'waiting' && !isProcessingRef.current && conversationModeRef.current === 'free') {
        setTimeout(() => startListening(), 50)
      }
    }
  }

  const endCall = () => {
    stopListening()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    navigate('/chat')
  }

  const getHeaderSubtitle = () => {
    if (aiStatus === 'speaking') return 'La IA está hablando...'
    if (aiStatus === 'thinking') return 'Procesando tu respuesta...'
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
            <img src="/Logo.png" alt="MindSee Logo" className="session-start-logo" />
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
                if (modelsLoaded) initiateAI(currentEmotion.type)
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

      <div className={`call-video-wrapper ${aiStatus === 'speaking' ? 'pulsing-aura' : ''}`}>
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
          {EMOTION_LABELS_ES[currentEmotion.type] || currentEmotion.type}
        </div>
      </div>

      <div className="call-controls-wrapper">
        <div className="call-action-area">
          {lastAiMessage && (
            <div className="call-ai-subtitle">
              "{lastAiMessage}"
            </div>
          )}

          {conversationMode === 'push-to-talk' && sessionStarted && (
            <div className="call-ptt-container">
              <button
                className={`call-ptt-btn ${isListening ? 'listening' : ''} ${(aiStatus !== 'waiting' || isMuted) ? 'disabled' : ''}`}
                onClick={() => {
                  if (aiStatus !== 'waiting' || isMuted) return
                  if (isListening) {
                    stopListening()
                  } else {
                    startListening()
                  }
                }}
                disabled={aiStatus !== 'waiting' || isMuted}
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
                if (aiStatus === 'waiting' && !isProcessingRef.current) {
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
            className="call-dock-btn secondary-action"
            onClick={() => navigate('/dashboard')}
          >
            <span className="btn-icon">🎛️</span>
            <span className="btn-text">Panel</span>
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
    </div>
  )
}
