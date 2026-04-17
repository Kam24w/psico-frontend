import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { LoginRequest } from '../types/domain'
import { UI_TEXTS } from '../constants/texts'

type ApiError = { response?: { data?: { error?: string } } }

export default function LoginPage() {
  const texts = UI_TEXTS.auth.login
  const [form, setForm]     = useState<LoginRequest>({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login }           = useAuth()
  const navigate            = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authService.login(form)
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
        <h1 className="auth-title">{UI_TEXTS.auth.appName}</h1>
        <p className="auth-subtitle">{texts.subtitle}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            className="auth-input"
            type="email"
            placeholder={texts.emailPlaceholder}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder={texts.passwordPlaceholder}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? texts.submitLoading : texts.submitIdle}
          </button>
        </form>

        <p className="auth-link-text">
          {texts.registerQuestion} <Link to="/register" className="auth-link-action">{texts.registerAction}</Link>
        </p>
      </div>
    </div>
  )
}
