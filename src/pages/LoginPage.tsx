import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/api'
import { cfObfuscateCompact } from '../services/security'
import { useAuth } from '../context/AuthContext'
import type { LoginRequest } from '../types/domain'

type ApiError = { response?: { data?: { message?: string; error?: string } } }

export default function LoginPage() {
  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' })
  const [obfuscatedPwd, setObfuscatedPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newPlain = form.password.slice(0, -1)
      setForm({ ...form, password: newPlain })
      setObfuscatedPwd(cfObfuscateCompact(newPlain))
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (form.password.length < 12) {
        const newPlain = form.password + e.key
        setForm({ ...form, password: newPlain })
        setObfuscatedPwd(cfObfuscateCompact(newPlain))
      }
    }
    if (e.key.length === 1 || e.key === 'Backspace') {
      e.preventDefault()
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authService.login(form)
      login(res.data)
      navigate('/call')
    } catch (err) {
      const apiError = err as ApiError
      setError(
        apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        'Credenciales incorrectas. Intenta de nuevo.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Blobs decorativos */}
      <div className="global-blob-1" />
      <div className="global-blob-2" />
      <div className="global-blob-3" />

      <div className="auth-card">

        <div className="auth-header">
          <h1 className="auth-title">Bienvenido de vuelta</h1>
          <p className="auth-subtitle">Tu espacio de bienestar te espera</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Correo electrónico</label>
            <input
              className="auth-input"
              type="email"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={obfuscatedPwd}
              onKeyDown={handleKeyDown}
              onChange={() => {}}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="auth-link-text">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="auth-link-action">Regístrate aquí</Link>
        </p>
      </div>

      <div className="auth-security-badge">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
        Sesión segura y privada
      </div>
    </div>
  )
}