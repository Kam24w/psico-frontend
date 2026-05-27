import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services/api'
import type { UserProfile } from '../types/domain'

export default function ProfilePage() {
  const { usuario, logout } = useAuth()
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
  }

  const handleSavePreferences = async () => {
    const userId = usuario?.id || (usuario as any)?.usuarioId;
    if (!userId) return;
    
    setSaving(true);
    try {
      const res = await userService.updatePreferences(userId, JSON.stringify(prefs));
      setProfile(res.data);
      alert('Preferencias guardadas exitosamente');
    } catch(e) {
      alert('Error guardando preferencias');
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
            <header className="dash-page-header">
              <h1 className="dash-page-title">Tu Perfil</h1>
              <p className="dash-page-subtitle">Administra tu información personal y preferencias de la aplicación.</p>
            </header>

            {loading ? (
              <div className="dash-loading-spinner">
                <div className="light-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
              </div>
            ) : (
              <div className="profile-grid">
                
                {/* Personal Info Panel */}
                <div className="dash-panel profile-info-panel">
                  <h3 className="panel-title">Información Personal</h3>
                  
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-circle">
                      {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="profile-avatar-text">
                      <h2>{profile?.fullName}</h2>
                      <p>{profile?.email}</p>
                    </div>
                  </div>

                  <div className="profile-details-list">
                    <div className="profile-detail-item">
                      <span className="detail-label">Estado Emocional Reciente:</span>
                      <span className="detail-value emotion-badge">{profile?.currentEmotionalState || 'NEUTRAL'}</span>
                    </div>
                  </div>
                  
                  <p className="profile-read-only-note">
                    Para modificar tu nombre de usuario o correo electrónico, por favor contacta a soporte técnico.
                  </p>
                </div>

                {/* Preferences Panel */}
                <div className="dash-panel profile-prefs-panel">
                  <h3 className="panel-title">Preferencias de la Aplicación</h3>
                  
                  <div className="pref-item">
                    <div className="pref-info">
                      <h4>Modo Oscuro</h4>
                      <p>Habilitar el tema oscuro inmersivo en todas las vistas.</p>
                    </div>
                    <label className="pref-switch">
                      <input type="checkbox" checked={prefs.darkMode} onChange={() => handleTogglePref('darkMode')} />
                      <span className="pref-slider"></span>
                    </label>
                  </div>

                  <div className="pref-item">
                    <div className="pref-info">
                      <h4>Notificaciones Push</h4>
                      <p>Recibir notificaciones cuando la IA detecte alertas emocionales críticas.</p>
                    </div>
                    <label className="pref-switch">
                      <input type="checkbox" checked={prefs.notifications} onChange={() => handleTogglePref('notifications')} />
                      <span className="pref-slider"></span>
                    </label>
                  </div>

                  <div className="pref-item">
                    <div className="pref-info">
                      <h4>Recordatorio Diario</h4>
                      <p>Recibir un aviso para hacer tu check-in emocional al final del día.</p>
                    </div>
                    <label className="pref-switch">
                      <input type="checkbox" checked={prefs.dailyReminder} onChange={() => handleTogglePref('dailyReminder')} />
                      <span className="pref-slider"></span>
                    </label>
                  </div>

                  <div className="pref-item">
                    <div className="pref-info">
                      <h4>Modo Terapia Estricto</h4>
                      <p>La IA priorizará análisis técnicos y directos sobre charla casual.</p>
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
                  <h3 className="panel-title danger-title">Zona de Peligro</h3>
                  <p>Acciones irreversibles relacionadas a tus datos personales.</p>
                  
                  <div className="danger-action-row">
                    <div className="danger-action-info">
                      <h4>Cerrar Sesión</h4>
                      <p>Cierra la sesión actual en este dispositivo de forma segura.</p>
                    </div>
                    <button className="danger-btn outline" onClick={handleLogout}>Cerrar Sesión</button>
                  </div>

                  <div className="danger-action-row">
                    <div className="danger-action-info">
                      <h4>Eliminar Datos y Memorias</h4>
                      <p>Borra permanentemente todo el historial de conversaciones y memorias guardadas. (No disponible en beta)</p>
                    </div>
                    <button className="danger-btn disabled" disabled>Eliminar Datos</button>
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
