import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEmotionDetector } from '../hooks/useEmotionDetector'
import { conversacionService } from '../services/api'
import type { TipoEmocion } from '../types/domain'

export default function CallPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Emotion Detection Hook
  const { emocionActual, modelosCargados, errorCamara } = useEmotionDetector(videoRef)
  
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [aiStatus, setAiStatus] = useState<'esperando' | 'pensando' | 'hablando'>('esperando')
  const [lastAiMessage, setLastAiMessage] = useState('')
  const [sessionStarted, setSessionStarted] = useState(false) // Nuevo estado para gesto inicial
  
  const recognitionRef = useRef<any>(null)
  const hasInitiatedRef = useRef(false)
  const emotionTimeoutRef = useRef<any>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // --- TTS (Text to Speech) ---
  const speak = useCallback((text: string) => {
    console.log("🔊 AI ATTEMPTING TO SPEAK:", text)
    if (!text || !isMountedRef.current) return
    
    // NO llamar cancel() aquí — causa el error 'interrupted' si el componente se remounta
    // Detener reconocimiento mientras la IA habla
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch(e) {}
    }

    setAiStatus('hablando')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 0.95
    
    // Selección de voz en español
    const voices = window.speechSynthesis.getVoices()
    const spanishVoice = voices.find(v => v.lang.startsWith('es'))
    if (spanishVoice) {
      utterance.voice = spanishVoice
      console.log("🗣️ Voice:", spanishVoice.name)
    }

    utterance.onstart = () => {
      console.log("🎙️ AI started speaking")
    }

    utterance.onend = () => {
      console.log("🏁 AI finished speaking")
      if (isMountedRef.current) {
        setAiStatus('esperando')
        setTimeout(() => {
          if (recognitionRef.current && !isMuted && isMountedRef.current) {
            console.log("🎤 Resuming recognition...")
            try { recognitionRef.current.start() } catch(e) {}
          }
        }, 800)
      }
    }

    utterance.onerror = (e: any) => {
      // Ignorar 'interrupted' ya que es un artefacto del ciclo de vida
      if (e.error === 'interrupted') {
        console.warn("⚠️ Speech interrupted (lifecycle artifact) — ignoring")
        return
      }
      console.error("❌ SpeechSynthesis error:", e.error)
      if (isMountedRef.current) setAiStatus('esperando')
    }

    window.speechSynthesis.speak(utterance)
  }, [isMuted])

  // --- STT (Speech to Text) ---
  const processVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return
    setAiStatus('pensando')
    try {
      // ── Llamar al backend que orquesta la IA, memoria y riesgo ──────────────────────────
      const response = await conversacionService.enviarMensaje(usuario.id, text, emocionActual.tipo || 'NEUTRAL');
      const data = (response as any).data || response;
      const respuesta = data.content || data.cleaned || (typeof data === 'string' ? data : 'Error procesando respuesta');
      console.log('✅ AI RESPONSE:', respuesta)
      setLastAiMessage(respuesta)
      speak(respuesta)
    } catch (err) {
      console.error('Error sending voice message', err)
      setAiStatus('esperando')
    }
  }, [emocionActual, speak])

  // --- AI Initiative (Initial Greeting) ---
  const initiateAI = useCallback(async (detectedEmotion: TipoEmocion) => {
    if (hasInitiatedRef.current) return
    hasInitiatedRef.current = true
    
    setAiStatus('pensando')
    try {
      console.log('🚀 INICIANDO sesión de voz con emoción:', detectedEmotion)
      // ── Llamar al backend que orquesta la IA, memoria y riesgo ──────────────────────────
      const response = await conversacionService.iniciarConversacion(detectedEmotion);
      const data = (response as any).data || response;
      const saludo = data.content || data.cleaned || (typeof data === 'string' ? data : 'Hola, ¿cómo te sientes?');
      console.log('✅ SALUDO IA:', saludo)
      setLastAiMessage(saludo)
      speak(saludo)
    } catch (err) {
      console.error('Error initiating conversation:', err)
      if (isMountedRef.current) setAiStatus('esperando')
    }
  }, [speak])

  // --- Initialize Web Speech API ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'es-ES'

      recognition.onstart = () => {
        console.log("🟢 SpeechRecognition started - Listening...")
      }

      recognition.onerror = (event: any) => {
        console.error("❌ SpeechRecognition error:", event.error)
        if (event.error === 'no-speech') {
          console.warn("No speech detected.")
        }
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        console.log("🎤 USER SAID:", transcript)
        processVoiceInput(transcript)
      }

      recognition.onend = () => {
        console.log("🔴 SpeechRecognition ended")
        // Automatically restart if we are still in "esperando" mode and not muted
        setTimeout(() => {
          if (recognitionRef.current && !isMuted && isMountedRef.current && !window.speechSynthesis.speaking) {
            console.log("🔄 Auto-restarting recognition...")
            try { recognitionRef.current.start() } catch(e) {}
          }
        }, 300)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort() } catch(e) {}
      }
      // NO llamar speechSynthesis.cancel() aqui — interrumpiria el audio activo
    }
  }, [isMuted, aiStatus, processVoiceInput])

  // --- Initiation Logic with Emotion Timeout ---
  // SOLO se activa si el usuario ya hizo clic en "Comenzar Sesion"
  useEffect(() => {
    if (!sessionStarted) return // <- Gatekeeper clave
    if (modelosCargados && !hasInitiatedRef.current) {
      emotionTimeoutRef.current = setTimeout(() => {
        console.log("Emotion detection timeout - using NEUTRAL")
        initiateAI('NEUTRAL')
      }, 3000)
    }
    
    return () => {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current)
    }
  }, [sessionStarted, modelosCargados, initiateAI])

  // Si detectamos una emocion antes del timeout Y ya inicio la sesion, usarla
  useEffect(() => {
    if (!sessionStarted) return
    if (emocionActual.tipo !== 'NEUTRAL' && !hasInitiatedRef.current && modelosCargados) {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current)
      initiateAI(emocionActual.tipo)
    }
  }, [sessionStarted, emocionActual, initiateAI, modelosCargados])

  const toggleMute = () => {
    if (recognitionRef.current) {
      if (!isMuted) {
        recognitionRef.current.stop()
      } else {
        try { recognitionRef.current.start() } catch(e) {}
      }
    }
    setIsMuted(!isMuted)
  }

  const endCall = () => {
    navigate('/chat')
  }

  return (
    <div className="call-page">
      {!sessionStarted && (
        <div className="session-start-overlay">
          <div className="session-start-card">
            <div className="session-start-icon">🧠</div>
            <h2>¿Listo para empezar?</h2>
            <p>Haz clic para activar el audio y comenzar tu sesión.</p>
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
          {aiStatus === 'hablando' ? 'La IA está hablando...' : 
           aiStatus === 'pensando' ? 'La IA está pensando...' : 
           'Escuchándote...'}
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

      {lastAiMessage && (
        <div className="call-ai-subtitle">
          "{lastAiMessage}"
        </div>
      )}

      <div className="call-dock">
        <button 
          className={`call-dock-btn ${isMuted ? 'muted' : ''}`} 
          onClick={toggleMute}
          title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
        >
          <span className="btn-icon">{isMuted ? '🔇' : '🎙️'}</span>
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
