import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CameraPanel from '../components/Camera/CameraPanel'
import ChatWindow from '../components/Chat/ChatWindow'
import { useAuth } from '../context/AuthContext'

export default function ChatPage() {
  const [emocionActual, setEmocionActual] = useState({ tipo: 'NEUTRAL', intensidad: 0 })
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <header style={styles.navbar}>
        <div style={styles.navBrand}>🧠 Psicólogo Virtual</div>
        <div style={styles.navRight}>
          <span style={styles.navUser}>👤 {usuario?.nombre}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Salir</button>
        </div>
      </header>

      {/* Main layout */}
      <main style={styles.main}>
        {/* Panel izquierdo: cámara + emoción */}
        <aside style={styles.aside}>
          <CameraPanel onEmocionCambia={setEmocionActual} />
          <div style={styles.tip}>
            <p style={styles.tipText}>
              💡 <strong>¿Cómo funciona?</strong><br />
              La cámara detecta tu emoción y yo adapto mis respuestas para acompañarte mejor.
            </p>
          </div>
        </aside>

        {/* Panel derecho: chat */}
        <section style={styles.chatSection}>
          <ChatWindow emocionActual={emocionActual} />
        </section>
      </main>
    </div>
  )
}

const styles = {
  page: {
    height: '100vh', display: 'flex', flexDirection: 'column',
    background: '#F0F2F5',
  },
  navbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #6C63FF, #764ba2)',
    color: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
  },
  navBrand:  { fontSize: 20, fontWeight: 700 },
  navRight:  { display: 'flex', alignItems: 'center', gap: 16 },
  navUser:   { fontSize: 14, opacity: 0.9 },
  logoutBtn: {
    padding: '6px 16px', borderRadius: 20,
    background: 'rgba(255,255,255,0.2)', color: '#fff',
    fontSize: 13, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.3)',
    transition: 'background 0.2s',
  },
  main: {
    flex: 1, display: 'flex', gap: 20,
    padding: '20px 32px', overflow: 'hidden',
  },
  aside: {
    display: 'flex', flexDirection: 'column', gap: 12,
    width: 270, flexShrink: 0,
  },
  tip: {
    background: '#fff', borderRadius: 16, padding: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },
  tipText: { fontSize: 13, color: '#555', lineHeight: 1.6 },
  chatSection: {
    flex: 1, display: 'flex', flexDirection: 'column',
    minWidth: 0,
  },
}
