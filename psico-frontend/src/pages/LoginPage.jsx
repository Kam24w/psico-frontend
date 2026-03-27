import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login }           = useAuth()
  const navigate            = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authService.login(form)
      login(res.data)
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🧠</div>
        <h1 style={styles.title}>Psicólogo Virtual</h1>
        <p style={styles.subtitle}>Tu espacio seguro para hablar</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p style={styles.link}>
          ¿No tienes cuenta? <Link to="/register" style={styles.linkA}>Regístrate</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
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
    border: '1.5px solid #E0E0E0', fontSize: 15,
    transition: 'border 0.2s',
    width: '100%',
  },
  button: {
    padding: '14px', borderRadius: 12, fontSize: 16, fontWeight: 600,
    background: 'linear-gradient(135deg, #6C63FF, #764ba2)',
    color: '#fff', marginTop: 4,
    transition: 'opacity 0.2s',
  },
  error: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  link:  { fontSize: 14, color: '#888', marginTop: 8 },
  linkA: { color: '#6C63FF', fontWeight: 600, textDecoration: 'none' },
}
