import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { memoryService, userService } from '../services/api'
import MemoryCard from '../components/Memory/MemoryCard'
import AddMemoryModal from '../components/Memory/AddMemoryModal'
import type { UserMemory, EmotionType, UserProfile } from '../types/domain'

export default function MemoriesPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [memories, setMemories] = useState<UserMemory[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchMemoriesAndProfile = async () => {
    if (!usuario) return
    const userId = usuario.id || (usuario as any).usuarioId
    if (!userId) {
        setLoading(false)
        return
    }
    
    try {
      const [memoriesRes, profileRes] = await Promise.all([
        memoryService.getMemories(userId),
        userService.getProfile(userId)
      ])
      setMemories(memoriesRes.data || [])
      setProfile(profileRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemoriesAndProfile()
  }, [usuario])

  const handleSaveMemory = async (text: string, emotion: EmotionType) => {
    if (!usuario) return
    const userId = usuario.id || (usuario as any).usuarioId
    await memoryService.saveMemory(userId, text, emotion)
    await fetchMemoriesAndProfile() // Recargar memorias
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userName = usuario?.name || (usuario as any)?.nombre || 'Usuario'

  return (
    <div className="memories-page">
      <div className="global-blob-1"></div>
      <div className="global-blob-2"></div>
      <div className="global-blob-3"></div>

      <nav className="dash-top-nav">
        <div className="dash-nav-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <span className="dash-logo-icon">🧠</span>
          <span className="dash-logo-text">Mindsee</span>
        </div>
        <div className="dash-nav-profile">
          <button onClick={() => navigate('/dashboard')} className="dash-nav-logout" style={{marginRight: '8px'}}>Volver al Panel</button>
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

      <main className="memories-main">
        <div className="memories-header-actions">
          <div>
            <h1 className="memories-title">Tu Diario Emocional</h1>
            <p className="memories-subtitle">Un espacio seguro para todos tus pensamientos y recuerdos.</p>
          </div>
          <button className="memories-add-btn" onClick={() => setIsModalOpen(true)}>
            + Nuevo Recuerdo
          </button>
        </div>

        {loading ? (
          <div className="memories-loading">Cargando tus recuerdos...</div>
        ) : memories.length === 0 ? (
          <div className="memories-empty">
            <span className="memories-empty-icon">💭</span>
            <h3>Aún no tienes recuerdos</h3>
            <p>Comienza a escribir cómo te sientes para llevar un registro de tu progreso.</p>
            <button className="memories-add-btn" onClick={() => setIsModalOpen(true)}>
              Crear mi primera memoria
            </button>
          </div>
        ) : (
          <div className="memories-grid">
            {memories.map(mem => (
              <MemoryCard key={mem.id} memory={mem} />
            ))}
          </div>
        )}
      </main>

      <AddMemoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMemory}
      />
    </div>
  )
}
