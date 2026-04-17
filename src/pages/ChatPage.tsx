import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraPanel from '../components/Camera/CameraPanel'
import ChatWindow from '../components/Chat/ChatWindow'
import { useAuth } from '../context/AuthContext'
import type { EmocionDetectada } from '../types/domain'
import { UI_TEXTS } from '../constants/texts'

export default function ChatPage() {
  const texts = UI_TEXTS.chatPage
  const [emocionActual, setEmocionActual] = useState<EmocionDetectada>({ tipo: 'NEUTRAL', intensidad: 0 })
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="chat-page">
      {/* Navbar */}
      <header className="chat-navbar">
        <div className="chat-nav-brand">🧠 {texts.navbarTitle}</div>
        <div className="chat-nav-right">
          <span className="chat-nav-user">👤 {texts.userPrefix}: {usuario?.nombre}</span>
          <button className="chat-logout-btn" onClick={handleLogout}>{texts.logout}</button>
        </div>
      </header>

      {/* Main layout */}
      <main className="chat-main-layout">
        {/* Panel izquierdo: cámara + emoción */}
        <aside className="chat-sidebar">
          <CameraPanel onEmocionCambia={setEmocionActual} />
          <div className="chat-tip-card">
            <p className="chat-tip-text">
              💡 <strong>{texts.tipTitle}</strong><br />
              {texts.tipDescription}
            </p>
          </div>
        </aside>

        {/* Panel derecho: chat */}
        <section className="chat-section">
          <ChatWindow emocionActual={emocionActual} />
        </section>
      </main>
    </div>
  )
}
