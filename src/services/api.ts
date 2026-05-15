import axios from 'axios'
import type {
  AuthPayload,
  Conversacion,
  DashboardSummary,
  Emotion,
  LoginRequest,
  Mensaje,
  Recomendacion,
  RegisterRequest,
  TipoEmocion,
} from '../types/domain'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
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

// Interceptor: manejo global de errores y wrapper ApiResponse
api.interceptors.response.use(
  (res) => {
    // Desenvolver la respuesta si usa el ApiResponse del backend { success, message, data }
    if (res.data && typeof res.data === 'object' && 'success' in res.data) {
      if (!res.data.success) {
        return Promise.reject(new Error(res.data.message || 'Error en la petición'))
      }
      res.data = res.data.data
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('psico_token')
      localStorage.removeItem('psico_usuario')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  login:    (data: LoginRequest)    => api.post<AuthPayload>('/api/auth/login', data),
  register: (data: RegisterRequest) => api.post<AuthPayload>('/api/auth/register', data),
}

// ── Conversación ──────────────────────────────────────────────────────────────
export const conversacionService = {
  /** Envía un mensaje y recibe la respuesta de la IA (MensajeResponse) */
  enviarMensaje: (usuarioId: number, contenido: string, emocion: TipoEmocion) =>
    api.post<Mensaje>('/api/conversations/message', {
      usuarioId,
      contenido,
      emocion,
    }),

  /** Historial de mensajes de una conversación */
  obtenerHistorial: (conversacionId: number) =>
    api.get<Mensaje[]>(`/api/conversations/history/${conversacionId}`),

  /** Historial de la sesión activa para el usuario actual (usando JWT) */
  obtenerHistorialActivo: () =>
    api.get<Mensaje[]>('/api/conversations/active-history'),

  /** Lista de conversaciones de un usuario */
  obtenerConversaciones: (usuarioId: number) =>
    api.get<Conversacion[]>(`/api/conversations/user/${usuarioId}`),

  /** Inicia una sesión de voz con un saludo de la IA */
  iniciarConversacion: (emocion: TipoEmocion) =>
    api.post<Mensaje>('/api/conversations/initiate', { emotion: emocion }),
}

// ── Emoción ───────────────────────────────────────────────────────────────────
export const emocionService = {
  /** Registra una emoción detectada */
  registrar: (usuarioId: number, tipo: TipoEmocion, intensidad: number) =>
    api.post<Emotion>('/api/emotions', { usuarioId, tipo, intensidad }),

  /** Última emoción registrada por el usuario */
  obtenerUltima: (usuarioId: number) =>
    api.get<TipoEmocion>(`/api/emotions/latest/${usuarioId}`),

  /** Historial completo de emociones */
  obtenerHistorial: (usuarioId: number) =>
    api.get<Emotion[]>(`/api/emotions/history/${usuarioId}`),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  /** Resumen general del usuario (DashboardController → /api/dashboard/{id}) */
  obtenerResumen: (usuarioId: number) =>
    api.get<DashboardSummary>(`/api/dashboard/${usuarioId}`),

  /** Estadísticas detalladas (StatisticsController → /api/estadisticas/{id}) */
  obtenerEstadisticas: (usuarioId: number) =>
    api.get<DashboardSummary>(`/api/estadisticas/${usuarioId}`),
}

// ── Intervenciones ────────────────────────────────────────────────────────────
export const intervencionService = {
  /** Recomendaciones por emoción (InterventionController → /api/intervencion/{emocion}) */
  obtenerRecomendaciones: (emocion: TipoEmocion) =>
    api.get<Recomendacion[]>(`/api/intervencion/${emocion}`),

  /** Ejercicios terapéuticos (TherapeuticController → /api/terapia/ejercicios?emocion=) */
  sugerirEjercicios: (emocion: TipoEmocion) =>
    api.get<Recomendacion[]>('/api/terapia/ejercicios', { params: { emocion } }),
}

export default api
