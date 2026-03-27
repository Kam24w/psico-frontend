import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor: añade token JWT a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('psico_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor: manejo global de errores
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('psico_token')
      localStorage.removeItem('psico_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────
export const authService = {
  login:    (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
}

// ── Conversación ──────────────────────────────────
export const conversacionService = {
  enviarMensaje: (usuarioId, contenido, emocion) =>
    api.post('/api/conversacion/mensaje', { usuarioId, contenido, emocion }),
  obtenerHistorial: (conversacionId) =>
    api.get(`/api/conversacion/historial/${conversacionId}`),
  obtenerConversaciones: (usuarioId) =>
    api.get(`/api/conversacion/usuario/${usuarioId}`),
}

// ── Emoción ───────────────────────────────────────
export const emocionService = {
  registrar: (usuarioId, tipo, intensidad) =>
    api.post('/api/emocion', { usuarioId, tipo, intensidad }),
  obtenerHistorial: (usuarioId) =>
    api.get(`/api/emocion/historial/${usuarioId}`),
}

export default api
