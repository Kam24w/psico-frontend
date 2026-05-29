import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraPanel from '../components/Camera/CameraPanel'
import ChatWindow from '../components/Chat/ChatWindow'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/api'
import type { EmocionDetectada, UserProfile } from '../types/domain'

export default function ChatPage() {
  const [emocionActual, setEmocionActual] = useState<EmocionDetectada>({ type: 'NEUTRAL', intensity: 0 })
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const userId = usuario?.id || (usuario as any)?.usuarioId
    if (userId) {
      userService.getProfile(userId)
        .then(res => setProfile(res.data))
        .catch(err => console.error("Error fetching profile:", err))
    }
  }, [usuario])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userName = usuario?.name || (usuario as any)?.nombre || 'Usuario'

  const rawType = emocionActual?.type || (emocionActual as any)?.tipo || 'NEUTRAL';
  
  // Mapping for emoji representation
  const getEmotionEmoji = (type: string) => {
    switch (type) {
      case 'NEUTRAL': return '😐';
      case 'HAPPY':
      case 'FELIZ': return '😊';
      case 'SAD':
      case 'TRISTE': return '😢';
      case 'STRESSED':
      case 'ESTRESADO': return '😰';
      case 'ANGRY':
      case 'ENOJADO': return '😠';
      case 'ANXIOUS':
      case 'ANSIOSO': return '😟';
      case 'SURPRISED':
      case 'SORPRENDIDO': return '😲';
      default: return '🧠';
    }
  }

  // Mapping for Spanish label in UI
  const getEmotionLabelEs = (type: string) => {
    switch (type) {
      case 'HAPPY':
      case 'FELIZ': return 'Feliz';
      case 'SAD':
      case 'TRISTE': return 'Triste';
      case 'STRESSED':
      case 'ESTRESADO': return 'Estresado';
      case 'ANGRY':
      case 'ENOJADO': return 'Enojado';
      case 'ANXIOUS':
      case 'ANSIOSO': return 'Ansioso';
      case 'SURPRISED':
      case 'SORPRENDIDO': return 'Sorprendido';
      case 'NEUTRAL': return 'Neutral';
      default: return type;
    }
  }

  return (
    <div className="chat-layout-wrapper">
      {/* Sidebar Oscuro */}
      <aside className="chat-sidebar-dark">
        <div className="sidebar-brand">
          <img src="/Logo.png" alt="MindSee Logo" className="sidebar-brand-logo-img" />
          <div className="sidebar-brand-text">
            <h1>MindSee</h1>
            <p>APOYO EMOCIONAL 24/7</p>
          </div>
        </div>

        <div className="sidebar-scroll-area">
          <div className="sidebar-camera-section">
            <CameraPanel onEmocionCambia={setEmocionActual} />
          </div>

          <div className="sidebar-therapist-info">
            <h2>MindSee</h2>
            <p>IA de Apoyo Psicológico 24/7</p>
          </div>

          <div className="sidebar-emotion-section">
            <h3 className="sidebar-section-title">EMOCIÓN DETECTADA</h3>
            <div className="emotion-display-card">
              <div className="emotion-display-icon">
                {getEmotionEmoji(rawType)}
              </div>
              <div className="emotion-display-text">
                <span className="emotion-name">{getEmotionLabelEs(rawType)}</span>
                <span className="emotion-sub">Ligeramente {getEmotionLabelEs(rawType).toLowerCase()}</span>
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
           <button className="sidebar-action-btn" onClick={() => navigate('/dashboard')}>🎛️ Panel</button>
           <button className="sidebar-action-btn" onClick={() => navigate('/call')}>📞 Llamada</button>
           <button className="sidebar-action-btn sidebar-logout-btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
             <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
               {profile?.avatarUrl ? (
                 <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{userName.charAt(0).toUpperCase()}</span>
               )}
             </div>
             Salir ({userName})
           </button>
        </div>
      </aside>

      {/* Main Chat Area Blanco */}
      <main className="chat-main-light">
        <ChatWindow currentEmotion={emocionActual} emocionActual={emocionActual} />
      </main>
    </div>
  )
}