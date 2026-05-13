import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CallPage() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Start camera on mount
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        console.error("Error accessing media devices.", err)
      }
    }
    startCamera()
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled
      })
    }
    setIsMuted(!isMuted)
  }

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled
      })
    }
    setIsCameraOff(!isCameraOff)
  }

  const endCall = () => {
    // Stop all tracks before navigating away
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    navigate('/chat')
  }

  return (
    <div className="call-page">
      {/* Blobs decorativos globales heredados del tema oscuro */}
      <div className="global-blob-1" />
      <div className="global-blob-2" />
      <div className="global-blob-3" />

      {/* Título superior sutil */}
      <div className="call-header">
        <h2 className="call-header-title">Sesión Activa</h2>
        <p className="call-header-subtitle">Psicólogo Virtual - {usuario?.nombre || 'Usuario'}</p>
      </div>

      {/* Contenedor central de la cámara */}
      <div className={`call-video-wrapper ${isMuted ? '' : 'pulsing-aura'}`}>
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
            muted // we mute our own output to avoid feedback loop
          />
        )}
        
        {/* Botón flotante para ocultar cámara */}
        <button 
          className="call-hide-camera-btn" 
          onClick={toggleCamera}
          title={isCameraOff ? "Activar cámara" : "Ocultar cámara"}
        >
          {isCameraOff ? '👁️' : '🚫'} {/* Eye slash / Eye */}
        </button>
      </div>

      {/* Dock inferior (Glassmorphism) */}
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
          <span className="btn-text">Vista de Chat</span>
        </button>

        <button 
          className="call-dock-btn end-call" 
          onClick={endCall}
        >
          <span className="btn-icon">✖</span>
          <span className="btn-text">Finalizar Sesión</span>
        </button>
      </div>
    </div>
  )
}
