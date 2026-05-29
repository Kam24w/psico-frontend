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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const encodedPassword = btoa(unescape(encodeURIComponent(form.password)))
      const res = await authService.login({
        ...form,
        password: encodedPassword
      })
      login(res.data)
      navigate('/dashboard')
    } catch (err) {
      const apiError = err as ApiError
      const isNetworkError = (err as any).message === 'Network Error' || !(err as any).response;
      
      setError(
        isNetworkError 
          ? 'Error de conexión. ¿Está el servidor encendido o VITE_API_URL bien configurada?'
          : apiError.response?.data?.message || apiError.response?.data?.error || 'Credenciales incorrectas. Intenta de nuevo.'
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
        <div className="auth-brand">
          <div className="auth-brand-title-container">
            <img src="/Logo.png" alt="MindSee Logo" className="auth-brand-logo-only" />
            <h1 className="auth-brand-name">MindSee</h1>
          </div>
        </div>

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
              maxLength={30}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              maxLength={20}
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="auth-link">Regístrate aquí</Link>
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