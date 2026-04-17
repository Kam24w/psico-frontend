import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/api'
import { cfObfuscate, cfObfuscateCompact } from '../services/security'
import { useAuth } from '../context/AuthContext'
import type { RegisterRequest } from '../types/domain'
import { UI_TEXTS } from '../constants/texts'

type ApiError = { response?: { data?: { error?: string } } }

export default function RegisterPage() {
  const texts = UI_TEXTS.auth.register
  const [form, setForm]       = useState<RegisterRequest>({ nombre: '', email: '', password: '' })
  const [obfuscatedPwd, setObfuscatedPwd] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

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
      const res = await authService.register({
        ...form,
        password: cfObfuscate(form.password)
      })
      login(res.data)
      navigate('/chat')
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.response?.data?.error || texts.fallbackError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🧠</div>
        <h1 className="auth-title">{texts.title}</h1>
        <p className="auth-subtitle">{texts.subtitle}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="auth-input" type="text" placeholder={texts.namePlaceholder}
            value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required
          />
          <input
            className="auth-input" type="email" placeholder={texts.emailPlaceholder}
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
          />
          <input
            className="auth-input" type="password" placeholder={texts.passwordPlaceholder}
            value={obfuscatedPwd}
            onKeyDown={handleKeyDown}
            onChange={() => {}} // Dummy to satisfy React
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? texts.submitLoading : texts.submitIdle}
          </button>
        </form>

        <p className="auth-link-text">
          {texts.loginQuestion} <Link to="/login" className="auth-link-action">{texts.loginAction}</Link>
        </p>
      </div>
    </div>
  )
}
