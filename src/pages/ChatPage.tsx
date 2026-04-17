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
    <div className="chat-page">
      {/* Navbar */}
      <header className="chat-navbar">
        <div className="chat-nav-brand">🧠 Psicólogo Virtual</div>
        <div className="chat-nav-right">
          <span className="chat-nav-user">👤 {usuario?.nombre}</span>
          <button className="chat-logout-btn" onClick={handleLogout}>Salir</button>
        </div>
      </header>

      {/* Main layout */}
      <main className="chat-main-layout">
        {/* Panel izquierdo: cámara + emoción */}
        <aside className="chat-sidebar">
          <CameraPanel onEmocionCambia={setEmocionActual} />
          <div className="chat-tip-card">
            <p className="chat-tip-text">
              💡 <strong>¿Cómo funciona?</strong><br />
              La cámara detecta tu emoción y yo adapto mis respuestas para acompañarte mejor.
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
