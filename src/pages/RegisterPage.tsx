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

  const [obfuscatedPwd, setObfuscatedPwd] = useState('')
  const [obfuscatedConfirmPwd, setObfuscatedConfirmPwd] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: 'password' | 'confirmPassword') => {
    const isConfirm = field === 'confirmPassword'
    const currentPlain = isConfirm ? form.confirmPassword! : form.password

    if (e.key === 'Backspace') {
      const newPlain = currentPlain.slice(0, -1)
      setForm({ ...form, [field]: newPlain })
      isConfirm ? setObfuscatedConfirmPwd(cfObfuscateCompact(newPlain)) : setObfuscatedPwd(cfObfuscateCompact(newPlain))
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (currentPlain.length < 12) {
        const newPlain = currentPlain + e.key
        setForm({ ...form, [field]: newPlain })
        isConfirm ? setObfuscatedConfirmPwd(cfObfuscateCompact(newPlain)) : setObfuscatedPwd(cfObfuscateCompact(newPlain))
      }
    }
    if (e.key.length === 1 || e.key === 'Backspace') {
      e.preventDefault()
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await authService.register({
        name:     form.name,
        email:    form.email,
        password: form.password,
      })
      login(res.data)
      navigate('/call')
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
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Correo electrónico</label>
            <input
              className="auth-input" type="email" placeholder="tu@correo.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Contraseña</label>
            <input
              className="auth-input" type="password" placeholder="••••••••"
              value={obfuscatedPwd}
              onKeyDown={(e) => handleKeyDown(e, 'password')}
              onChange={() => {}}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Confirmar contraseña</label>
            <input
              className="auth-input" type="password" placeholder="••••••••"
              value={obfuscatedConfirmPwd}
              onKeyDown={(e) => handleKeyDown(e, 'confirmPassword')}
              onChange={() => {}}
              required
            />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="auth-link-text">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="auth-link-action">Inicia sesión</Link>
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