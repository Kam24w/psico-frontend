import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { userService } from '../services/api'
import type { UserProfile } from '../types/domain'

export default function ProfilePage() {
  const { usuario, logout } = useAuth()
  const { setTheme } = useTheme()
  const { showToast, showConfirm } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Preferences state
  const [prefs, setPrefs] = useState({
    notifications: true,
    dailyReminder: false,
    strictTherapyMode: false,
    darkMode: true
  })

  useEffect(() => {
    const userId = usuario?.id || (usuario as any)?.usuarioId
    if (userId) {
      userService.getProfile(userId)
        .then(res => {
          setProfile(res.data)
          try {
             if (res.data.preferences && res.data.preferences !== '[]') {
                const parsed = JSON.parse(res.data.preferences);
                setPrefs(prev => ({...prev, ...parsed}));
                if (parsed.darkMode !== undefined) {
                  setTheme(parsed.darkMode ? 'dark' : 'light');
                }
             }
          } catch(e) {}
        })
        .catch(err => console.error("Error fetching profile:", err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [usuario])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleTogglePref = (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    if (key === 'darkMode') {
      setTheme(newPrefs.darkMode ? 'dark' : 'light');
    }
  }

  const handleSavePreferences = async () => {
    const userId = usuario?.id || (usuario as any)?.usuarioId;
    if (!userId) return;
    
    setSaving(true);
    try {
      const res = await userService.updatePreferences(userId, JSON.stringify(prefs));
      setProfile(res.data);
      showToast('Preferencias guardadas exitosamente', 'success');
    } catch(e) {
      showToast('Error guardando preferencias', 'error');
    } finally {
      setSaving(false);
    }
  }

  const userName = usuario?.name || (usuario as any)?.nombre || 'Usuario'

  return (
    <div className="dash-app-layout">
      {/* Top Navbar */}
      <nav className="dash-top-nav">
        <div className="dash-nav-brand" onClick={() => navigate('/dashboard')} style={{cursor: 'pointer'}}>
          <span className="dash-logo-icon">🧠</span>
          <span className="dash-logo-text">Mindsee</span>
        </div>
        <div className="dash-nav-profile">
          <span className="dash-nav-greeting">Hola, {userName.toLowerCase()}</span>
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
              <p className="dash-page-subtitle">Administra tu identidad, preferencias y la forma en que la IA de Mindsee interactúa contigo.</p>
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
                    <div className="profile-avatar-circle">
                      {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
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

                {/* Right Column: Preferences & Danger Zone */}
                <div className="profile-right-column">
                  
                  {/* Preferences Panel */}
                  <div className="dash-panel profile-prefs-panel">
                    <h3 className="panel-title">Preferencias de la Aplicación</h3>
                    
                    <div className="pref-item">
                      <div className="pref-info-wrapper">
                        <div className="pref-icon">🌙</div>
                        <div className="pref-info">
                          <h4>Tema Oscuro Inmersivo</h4>
                          <p>Habilitar el tema oscuro tipo Glassmorphism en todas las vistas.</p>
                        </div>
                      </div>
                      <label className="pref-switch">
                        <input type="checkbox" checked={prefs.darkMode} onChange={() => handleTogglePref('darkMode')} />
                        <span className="pref-slider"></span>
                      </label>
                    </div>

                    <div className="pref-item">
                      <div className="pref-info-wrapper">
                        <div className="pref-icon">🔔</div>
                        <div className="pref-info">
                          <h4>Notificaciones Push</h4>
                          <p>Recibir notificaciones cuando la IA detecte alertas críticas.</p>
                        </div>
                      </div>
                      <label className="pref-switch">
                        <input type="checkbox" checked={prefs.notifications} onChange={() => handleTogglePref('notifications')} />
                        <span className="pref-slider"></span>
                      </label>
                    </div>

                    <div className="pref-item">
                      <div className="pref-info-wrapper">
                        <div className="pref-icon">📅</div>
                        <div className="pref-info">
                          <h4>Recordatorio Diario</h4>
                          <p>Recibir un aviso para hacer tu check-in emocional diario.</p>
                        </div>
                      </div>
                      <label className="pref-switch">
                        <input type="checkbox" checked={prefs.dailyReminder} onChange={() => handleTogglePref('dailyReminder')} />
                        <span className="pref-slider"></span>
                      </label>
                    </div>

                    <div className="pref-item">
                      <div className="pref-info-wrapper">
                        <div className="pref-icon">🧠</div>
                        <div className="pref-info">
                          <h4>Modo Terapia Estricto</h4>
                          <p>La IA priorizará análisis técnicos y directos sobre charla casual.</p>
                        </div>
                      </div>
                      <label className="pref-switch">
                        <input type="checkbox" checked={prefs.strictTherapyMode} onChange={() => handleTogglePref('strictTherapyMode')} />
                        <span className="pref-slider"></span>
                      </label>
                    </div>

                    <button 
                      className="save-prefs-btn" 
                      onClick={handleSavePreferences}
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar Preferencias'}
                    </button>
                  </div>

                  {/* Danger Zone */}
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

                    <div className="danger-action-row">
                      <div className="danger-action-info">
                        <h4>Eliminar Datos y Memorias</h4>
                        <p>Borra permanentemente todo el historial de conversaciones y memorias guardadas. Esta acción no se puede deshacer.</p>
                      </div>
                      <button className="danger-btn disabled" disabled>Eliminar Datos</button>
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
