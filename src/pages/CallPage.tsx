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
  
  const recognitionRef = useRef<any>(null)
  const hasInitiatedRef = useRef(false)
  const emotionTimeoutRef = useRef<any>(null)

  // --- TTS (Text to Speech) ---
  const speak = useCallback((text: string) => {
    if (!text) return
    
    // Stop recognition to avoid feedback loop
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch(e) {}
    }

    setAiStatus('hablando')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 1.0
    
    utterance.onend = () => {
      setAiStatus('esperando')
      // Resume recognition after AI finishes speaking
      if (recognitionRef.current && !isMuted) {
        try { recognitionRef.current.start() } catch(e) {}
      }
    }

    window.speechSynthesis.speak(utterance)
  }, [isMuted])

  // --- STT (Speech to Text) ---
  const processVoiceInput = useCallback(async (text: string) => {
    if (!text.trim()) return
    setAiStatus('pensando')
    try {
      const res = await conversacionService.enviarMensaje(usuario?.id || 0, text, emocionActual.tipo)
      setLastAiMessage(res.data.content)
      speak(res.data.content)
    } catch (err) {
      console.error("Error sending voice message", err)
      setAiStatus('esperando')
    }
  }, [usuario, emocionActual, speak])

  // --- AI Initiative (Initial Greeting) ---
  const initiateAI = useCallback(async (detectedEmotion: TipoEmocion) => {
    if (hasInitiatedRef.current) return
    hasInitiatedRef.current = true
    
    setAiStatus('pensando')
    try {
      const res = await conversacionService.iniciarConversacion(detectedEmotion)
      setLastAiMessage(res.data.content)
      speak(res.data.content)
    } catch (err) {
      console.error("Error initiating conversation", err)
      setAiStatus('esperando')
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

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        processVoiceInput(transcript)
      }

      recognition.onend = () => {
        // Automatically restart if we are still in "esperando" mode and not muted
        // This keeps the conversation going
        setTimeout(() => {
          if (recognitionRef.current && !isMuted && aiStatus === 'esperando' && !window.speechSynthesis.speaking) {
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
      window.speechSynthesis.cancel()
    }
  }, [isMuted, aiStatus, processVoiceInput])

  // --- Initiation Logic with Emotion Timeout ---
  useEffect(() => {
    if (modelosCargados && !hasInitiatedRef.current) {
      // Start a 3-second timer for a "stable" emotion
      emotionTimeoutRef.current = setTimeout(() => {
        console.log("Emotion detection timeout - using NEUTRAL")
        initiateAI('NEUTRAL')
      }, 3000)
    }
    
    return () => {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current)
    }
  }, [modelosCargados, initiateAI])

  // If we detect something before the timeout, use it
  useEffect(() => {
    if (emocionActual.tipo !== 'NEUTRAL' && !hasInitiatedRef.current && modelosCargados) {
      if (emotionTimeoutRef.current) clearTimeout(emotionTimeoutRef.current)
      initiateAI(emocionActual.tipo)
    }
  }, [emocionActual, initiateAI, modelosCargados])

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
