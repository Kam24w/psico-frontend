import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraPanel from '../components/Camera/CameraPanel'
import ChatWindow from '../components/Chat/ChatWindow'
import { useAuth } from '../context/AuthContext'
import type { EmocionDetectada } from '../types/domain'

export default function ChatPage() {
  const [emocionActual, setEmocionActual] = useState<EmocionDetectada>({ tipo: 'NEUTRAL', intensidad: 0 })
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="chat-layout-wrapper">
      {/* Sidebar Oscuro */}
      <aside className="chat-sidebar-dark">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🧠</div>
          <div className="sidebar-brand-text">
            <h1>Psicólogo Virtual</h1>
            <p>APOYO EMOCIONAL 24/7</p>
          </div>
        </div>

        <div className="sidebar-scroll-area">
          <div className="sidebar-camera-section">
            <CameraPanel onEmocionCambia={setEmocionActual} />
          </div>

          <div className="sidebar-therapist-info">
            <h2>Psicólogo Virtual</h2>
            <p>IA de Apoyo Psicológico 24/7</p>
          </div>

          <div className="sidebar-emotion-section">
            <h3 className="sidebar-section-title">EMOCIÓN DETECTADA</h3>
            <div className="emotion-display-card">
              <div className="emotion-display-icon">
                {emocionActual.tipo === 'NEUTRAL' ? '😐' : 
                 emocionActual.tipo === 'FELIZ' ? '😊' :
                 emocionActual.tipo === 'TRISTE' ? '😢' : '🧠'}
              </div>
              <div className="emotion-display-text">
                <span className="emotion-name">{emocionActual.tipo === 'NEUTRAL' ? 'Neutral' : emocionActual.tipo}</span>
                <span className="emotion-sub">Ligeramente {emocionActual.tipo.toLowerCase()}</span>
              </div>
            </div>
            <p className="emotion-help-text">
              Tu cámara analiza tu estado emocional en tiempo real para personalizar mis respuestas.
            </p>
          </div>

          <div className="sidebar-tip-section">
            <h3 className="sidebar-section-title">¿CÓMO FUNCIONA?</h3>
            <div className="sidebar-tip-card">
              <span className="tip-icon">👁️</span> Detección facial
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
           <button className="sidebar-action-btn" onClick={() => navigate('/call')}>📞 Llamada</button>
           <button className="sidebar-action-btn sidebar-logout-btn" onClick={handleLogout}>Salir ({usuario?.nombre})</button>
        </div>
      </aside>

      {/* Main Chat Area Blanco */}
      <main className="chat-main-light">
        <ChatWindow emocionActual={emocionActual} />
      </main>
    </div>
  )
}