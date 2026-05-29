import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardService, userService } from '../services/api'
import type { DashboardSummary, UserProfile } from '../types/domain'

export default function DashboardPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = usuario?.id || (usuario as any)?.usuarioId
    if (userId) {
      Promise.all([
        dashboardService.getSummary(userId),
        userService.getProfile(userId)
      ])
        .then(([summaryRes, profileRes]) => {
          setSummary(summaryRes.data)
          setProfile(profileRes.data)
        })
        .catch(err => console.error("Error fetching data:", err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [usuario])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userName = usuario?.name || (usuario as any)?.nombre || 'Usuario'

  const getY = (score: number) => 100 - score;
  const progress = summary?.weeklyProgress || [50, 50, 50, 50, 50, 50, 50];
  const xCoords = [5, 20, 35, 50, 65, 80, 95];
  
  const polygonPoints = `5,100 ${progress.map((p, i) => `${xCoords[i]},${getY(p)}`).join(' ')} 95,100`;
  const polylinePoints = progress.map((p, i) => `${xCoords[i]},${getY(p)}`).join(' ');

  return (
    <div className="dash-app-layout">
      {/* Top Navbar */}
      <nav className="dash-top-nav">
        <div className="dash-nav-brand">
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
            <header className="dash-page-header">
              <h1 className="dash-page-title">Tu Panel de Bienestar</h1>
              <p className="dash-page-subtitle">Aquí tienes un resumen de tu progreso y estado emocional.</p>
            </header>

            {loading ? (
              <div className="dash-loading-spinner">
                <div className="light-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
              </div>
            ) : (
              <>
                {/* Top Stats Grid */}
                <div className="dash-stats-row">
                  <div className="dash-stat-card">
                    <div className="stat-card-icon shadow-icon">💬</div>
                    <div className="stat-card-info">
                      <div className="stat-card-val">{summary?.activeConversations || 0}</div>
                      <div className="stat-card-lbl">Sesiones activas</div>
                    </div>
                    <div className="stat-card-badge blue-badge">0</div>
                  </div>
                  
                  <div className="dash-stat-card">
                    <div className="stat-card-icon shadow-icon">📓</div>
                    <div className="stat-card-info">
                      <div className="stat-card-val">{summary?.savedMemories || 0}</div>
                      <div className="stat-card-lbl">Memorias guardadas</div>
                    </div>
                    <div className="stat-card-badge red-badge">0</div>
                  </div>

                  <div className="dash-stat-card">
                    <div className="stat-card-icon shadow-icon">📈</div>
                    <div className="stat-card-info">
                      <div className="stat-card-val">{summary?.emotionalTrend || 0}%</div>
                      <div className="stat-card-lbl">Tendencia positiva</div>
                    </div>
                    <div className="stat-card-badge green-badge">↗</div>
                  </div>
                </div>

                {/* Alert Bar */}
                <div className="dash-alert-bar">
                  <span className="alert-bulb">💡</span>
                  <span className="alert-msg">{summary?.latestAlert || "Sin alertas recientes"}</span>
                </div>

                {/* Middle Layout */}
                <div className="dash-middle-row">
                  {/* Line Chart Panel */}
                  <div className="dash-panel panel-chart">
                    <h3 className="panel-title">Progreso de Bienestar</h3>
                    <div className="chart-container">
                      <div className="chart-y-axis">
                        <span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
                      </div>
                      <div className="chart-graph-area">
                        <div className="chart-grid-lines">
                          <div></div><div></div><div></div><div></div><div></div>
                        </div>
                        <svg className="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(45, 212, 191, 0.4)"/>
                              <stop offset="100%" stopColor="rgba(45, 212, 191, 0)"/>
                            </linearGradient>
                          </defs>
                          <polygon points={polygonPoints} fill="url(#chart-grad)"/>
                          <polyline points={polylinePoints} fill="none" stroke="#2dd4bf" strokeWidth="1.5"/>
                          {progress.map((p, i) => (
                             <circle key={i} cx={xCoords[i]} cy={getY(p)} r="1.5" fill="#2dd4bf" stroke="#18181b" strokeWidth="0.5"/>
                          ))}
                        </svg>
                        <div className="chart-x-axis">
                          <span>D1</span><span>D2</span><span>D3</span><span>D4</span><span>D5</span><span>D6</span><span>D7</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Panel */}
                  <div className="dash-panel panel-summary">
                    <div className="summary-header">
                      <h3 className="panel-title">Resumen Semanal</h3>
                      <span className="summary-icon">📅</span>
                    </div>
                    <ul className="summary-list">
                      <li>
                        <span className="list-text">Chats finalizados: <strong>{summary?.finishedChats || 0}</strong></span>
                        <span className="list-dots">⋮</span>
                      </li>
                      <li>
                        <span className="list-text">Nuevas memorias: <strong>{summary?.newMemoriesThisWeek || 0}</strong></span>
                        <span className="list-dots">⋮</span>
                      </li>
                    </ul>
                    <p className="summary-footer-text">
                      Tu progreso refleja cómo te has sentido a lo largo de los últimos 7 días.<br/>¡Sigue así, {userName.toLowerCase()}!
                    </p>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="dash-actions-row">
                  <div className="dash-action-box" onClick={() => navigate('/call')}>
                    <div className="action-box-icon shadow-icon">📞</div>
                    <div className="action-box-info">
                      <h4>Videollamada</h4>
                      <p>Habla con tu Mindsee por voz y video</p>
                    </div>
                  </div>
                  
                  <div className="dash-action-box" onClick={() => navigate('/chat')}>
                    <div className="action-box-icon shadow-icon">✉️</div>
                    <div className="action-box-info">
                      <h4>Chat de Texto</h4>
                      <p>Escribe y exprésate a tu propio ritmo</p>
                    </div>
                  </div>

                  <div className="dash-action-box" onClick={() => navigate('/memories')}>
                    <div className="action-box-icon shadow-icon">💭</div>
                    <div className="action-box-info">
                      <h4>Mis Memorias</h4>
                      <p>Revisa tu diario emocional y progreso</p>
                    </div>
                  </div>
                </div>
              </>
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
