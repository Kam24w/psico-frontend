import axios from 'axios'
import type { AuthPayload, LoginRequest, Mensaje, RegisterRequest, TipoEmocion } from '../types/domain'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor: añade token JWT a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('psico_token')
  if (token) {
    if (config.headers) {
      ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
    } else {
      config.headers = { Authorization: `Bearer ${token}` } as never
    }
  }
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
  login:    (data: LoginRequest) => api.post<AuthPayload>('/api/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthPayload>('/api/auth/register', data),
}

// ── Conversación ──────────────────────────────────
export const conversacionService = {
  enviarMensaje: (usuarioId: number, contenido: string, emocion: TipoEmocion) =>
    api.post<Mensaje>('/api/conversacion/mensaje', { usuarioId, contenido, emocion }),
  obtenerHistorial: (conversacionId: number) =>
    api.get<Mensaje[]>(`/api/conversacion/historial/${conversacionId}`),
  obtenerConversaciones: (usuarioId: number) =>
    api.get<Mensaje[]>(`/api/conversacion/usuario/${usuarioId}`),
}

// ── Emoción ───────────────────────────────────────
export const emocionService = {
  registrar: (usuarioId: number, tipo: TipoEmocion, intensidad: number) =>
    api.post('/api/emocion', { usuarioId, tipo, intensidad }),
  obtenerHistorial: (usuarioId: number) =>
    api.get(`/api/emocion/historial/${usuarioId}`),
}

export default api
