import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { dashboardService } from '../services/api'
import type { DashboardSummary } from '../types/domain'

export default function DashboardPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = usuario?.id || (usuario as any)?.usuarioId
    if (userId) {
      dashboardService.getSummary(userId)
        .then(res => setSummary(res.data))
        .catch(err => console.error("Error fetching dashboard summary:", err))
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

  return (
    <div className="dash-app-layout">
      {/* Top Navbar */}
      <nav className="dash-top-nav">
        <div className="dash-nav-brand">
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
          <div className="dash-side-item disabled">
            <span className="side-icon">🏋️</span>
            <span className="side-label">Ejercicios</span>
          </div>
          <div className="dash-side-item disabled">
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
                          <polygon points="5,100 5,85 20,65 35,62 50,45 65,35 80,30 95,15 95,100" fill="url(#chart-grad)"/>
                          <polyline points="5,85 20,65 35,62 50,45 65,35 80,30 95,15" fill="none" stroke="#2dd4bf" strokeWidth="1.5"/>
                          <circle cx="5" cy="85" r="1.5" fill="#2dd4bf" stroke="#18181b" strokeWidth="0.5"/>
                          <circle cx="20" cy="65" r="1.5" fill="#2dd4bf" stroke="#18181b" strokeWidth="0.5"/>
                          <circle cx="35" cy="62" r="1.5" fill="#2dd4bf" stroke="#18181b" strokeWidth="0.5"/>
                          <circle cx="50" cy="45" r="1.5" fill="#2dd4bf" stroke="#18181b" strokeWidth="0.5"/>
                          <circle cx="65" cy="35" r="1.5" fill="#2dd4bf" stroke="#18181b" strokeWidth="0.5"/>
                          <circle cx="80" cy="30" r="1.5" fill="#2dd4bf" stroke="#18181b" strokeWidth="0.5"/>
                          <circle cx="95" cy="15" r="1.5" fill="#2dd4bf" stroke="#18181b" strokeWidth="0.5"/>
                        </svg>
                        <div className="chart-x-axis">
                          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
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
                        <span className="list-text">Chats finalizados: <strong>3</strong></span>
                        <span className="list-dots">⋮</span>
                      </li>
                      <li>
                        <span className="list-text">Nuevas memorias: <strong>1</strong></span>
                        <span className="list-dots">⋮</span>
                      </li>
                      <li>
                        <span className="list-text">Próximo ejercicio: <strong>Mañana (Mindfulness)</strong></span>
                        <span className="list-dots">⋮</span>
                      </li>
                    </ul>
                    <p className="summary-footer-text">
                      Your well-being score is up by 5% this week!<br/>Keep it up, {userName.toLowerCase()}.
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
              <span className="footer-right">Finalizados | Soporte | {userName} <span className="footer-star">✨</span></span>
            </footer>

          </div>
        </main>
      </div>
    </div>
  )
}
