import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { RegisterRequest } from '../types/domain'

type ApiError = { response?: { data?: { error?: string } } }

export default function RegisterPage() {
  const [form, setForm]       = useState<RegisterRequest>({ nombre: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authService.register(form)
      login(res.data)
      navigate('/chat')
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🧠</div>
        <h1 style={styles.title}>Crear cuenta</h1>
        <p style={styles.subtitle}>Únete a tu espacio de bienestar</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input} type="text" placeholder="Nombre completo"
            value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required
          />
          <input
            style={styles.input} type="email" placeholder="Correo electrónico"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
          />
          <input
            style={styles.input} type="password" placeholder="Contraseña"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p style={styles.link}>
          ¿Ya tienes cuenta? <Link to="/login" style={styles.linkA}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '48px 40px',
    width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  logo:     { fontSize: 56 },
  title:    { fontSize: 26, fontWeight: 700, color: '#2D2D2D', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 8, textAlign: 'center' },
  form:     { width: '100%', display: 'flex', flexDirection: 'column', gap: 14 },
  input: {
    padding: '14px 18px', borderRadius: 12,
    border: '1.5px solid #E0E0E0', fontSize: 15, width: '100%',
  },
  button: {
    padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 600,
    background: 'linear-gradient(135deg, #6C63FF, #764ba2)', color: '#fff', marginTop: 4,
  },
  error: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  link:  { fontSize: 14, color: '#888', marginTop: 8 },
  linkA: { color: '#6C63FF', fontWeight: 600, textDecoration: 'none' },
}
