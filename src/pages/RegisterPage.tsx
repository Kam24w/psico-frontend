import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/api'
import { cfObfuscateCompact } from '../services/security'
import { useAuth } from '../context/AuthContext'
import type { RegisterRequest } from '../types/domain'

type ApiError = { response?: { data?: { message?: string; error?: string } } }

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterRequest & { confirmPassword?: string }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError('')
    try {
      const encodedPassword = btoa(unescape(encodeURIComponent(form.password || '')))
      const res = await authService.register({
        name:     form.name,
        email:    form.email,
        password: encodedPassword,
      })
      login(res.data)
      navigate('/dashboard')
    } catch (err) {
      const apiError = err as ApiError
      setError(
        apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        'Error al crear la cuenta.'
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
          <h1 className="auth-title">Crea tu cuenta</h1>
          <p className="auth-subtitle">Comienza tu camino hacia el bienestar</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Nombre completo</label>
            <input
              className="auth-input" type="text" placeholder="Tu nombre"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
            maxLength={20}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Correo electrónico</label>
            <input
              className="auth-input" type="email" placeholder="tu@correo.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
              maxLength={30}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <input
              className="auth-input" type="password" placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              maxLength={20}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirmar contraseña</label>
            <input
              className="auth-input" type="password" placeholder="••••••••"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              required
              maxLength={20}
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="auth-link">Inicia sesión</Link>
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