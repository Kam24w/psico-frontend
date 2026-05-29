import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { userService } from '../services/api'
import type { UserProfile } from '../types/domain'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { showConfirm, showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userId = user?.id
    if (userId) {
      userService.getProfile(userId)
        .then(res => setProfile(res.data))
        .catch(err => console.error('Error fetching profile:', err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleAvatarClick = () => {
    if (uploading) return
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB to prevent large base64 strings in DB
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen es demasiado grande. El máximo es 2MB.', 'error')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64String = event.target?.result as string
      try {
        const userId = user?.id
        if (userId) {
          const res = await userService.updateAvatar(userId, base64String)
          setProfile(res.data)
          showToast('Foto de perfil actualizada exitosamente', 'success')
        }
      } catch (error) {
        console.error('Error updating avatar:', error)
        showToast('Error al actualizar la foto de perfil', 'error')
      } finally {
        setUploading(false)
      }
    }
    reader.onerror = () => {
      showToast('Error al procesar la imagen', 'error')
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const userName = user?.name || 'Usuario'

  return (
    <div className="dash-app-layout">
      {/* Top Navbar */}
      <nav className="dash-top-nav">
        <div className="dash-nav-brand" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          <img src="/Logo.png" alt="MindSee Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
          <span className="dash-logo-text">Mindsee</span>
        </div>
        <div className="dash-nav-profile">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="dash-nav-greeting" style={{ margin: 0 }}>Hola, {userName.toLowerCase()}</span>
          </div>
          <button onClick={handleLogout} className="dash-nav-logout">Salir</button>
        </div>
      </nav>

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <div className={`dash-side-item ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
            <span className="side-icon">🎛️</span>
            <span className="side-label">Dashboard</span>
          </div>
          <div className={`dash-side-item ${location.pathname === '/chat' ? 'active' : ''}`} onClick={() => navigate('/chat')}>
            <span className="side-icon">💬</span>
            <span className="side-label">Chat</span>
          </div>
          <div className={`dash-side-item ${location.pathname === '/call' ? 'active' : ''}`} onClick={() => navigate('/call')}>
            <span className="side-icon">🎥</span>
            <span className="side-label">Videocall</span>
          </div>
          <div className={`dash-side-item ${location.pathname === '/memories' ? 'active' : ''}`} onClick={() => navigate('/memories')}>
            <span className="side-icon">📓</span>
            <span className="side-label">Memories</span>
          </div>
          <div className={`dash-side-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
            <span className="side-icon">👤</span>
            <span className="side-label">Perfil</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="dash-content-area">
          <div className="dash-content-inner">

            {/* Header */}
            <header className="dash-page-header" style={{marginBottom: '24px'}}>
              <h1 className="dash-page-title">Tu Perfil</h1>
              <p className="dash-page-subtitle">Administra tu identidad y la forma en que la IA de Mindsee interactúa contigo.</p>
            </header>

            {loading ? (
              <div className="dash-loading-spinner">
                <div className="light-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
              </div>
            ) : (
              <div className="profile-grid">

                {/* Left Column: Personal Info Panel */}
                <div className="dash-panel profile-info-panel">
                  <div className="profile-banner"></div>

                  <div className="profile-avatar-wrapper">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*" 
                      style={{ display: 'none' }} 
                    />
                    <div 
                      className="profile-avatar-circle" 
                      onClick={handleAvatarClick}
                      style={{ opacity: uploading ? 0.5 : 1, cursor: uploading ? 'wait' : 'pointer' }}
                    >
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Avatar" />
                      ) : (
                        profile?.fullName?.charAt(0).toUpperCase() || 'U'
                      )}
                      
                      {!uploading && (
                        <div className="profile-avatar-overlay">
                          📷
                        </div>
                      )}
                    </div>
                    <div className="profile-avatar-text">
                      <h2>{profile?.fullName}</h2>
                      <p>{profile?.email}</p>
                    </div>

                    <div className="profile-details-list">
                      <div className="profile-detail-item">
                        <span className="detail-label">Estado Actual</span>
                        <span className="detail-value emotion-badge">{profile?.currentEmotionalState || 'NEUTRAL'}</span>
                      </div>
                    </div>

                    <p className="profile-read-only-note">
                      Para modificar tu nombre de usuario o correo electrónico, por favor contacta a soporte técnico de Mindsee.
                    </p>
                  </div>
                </div>

                {/* Right Column: Danger Zone */}
                <div className="profile-right-column">
                  <div className="dash-panel profile-danger-panel">
                    <h3 className="panel-title danger-title">
                      <span style={{fontSize: '24px'}}>⚠️</span> Zona de Peligro
                    </h3>

                    <div className="danger-action-row">
                      <div className="danger-action-info">
                        <h4>Cerrar Sesión</h4>
                        <p>Cierra la sesión actual en este dispositivo de forma segura, borrando tu token local.</p>
                      </div>
                      <button className="danger-btn" onClick={() => showConfirm('¿Estás seguro de que deseas cerrar la sesión actual?', handleLogout)}>Cerrar Sesión</button>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* Footer */}
            <footer className="dash-footer">
              <span className="footer-left">© 2026 Mindsee</span>
            </footer>

          </div>
        </main>
      </div>
    </div>
  )
}
