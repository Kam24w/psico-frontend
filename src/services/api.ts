import axios from 'axios'
import type {
  AuthPayload,
  Conversation,
  DashboardSummary,
  Emotion,
  LoginRequest,
  Message,
  Recommendation,
  RegisterRequest,
  EmotionType,
  UserMemory,
  UserProfile,
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

// ── Conversation ──────────────────────────────────────────────────────────────
export const conversationService = {
  /** Envía un mensaje y recibe la respuesta de la IA (MessageResponse) */
  sendMessage: (userId: number, content: string, emotion: EmotionType, sessionType: string = 'TEXTO') =>
    api.post<Message>('/api/conversations/message', {
      userId,
      content,
      emotion,
      sessionType,
    }),

  /** Historial de mensajes de una conversación */
  getHistory: (conversationId: number) =>
    api.get<Message[]>(`/api/conversations/history/${conversationId}`),

  /** Historial de la sesión activa para el usuario actual (usando JWT), filtrado por tipo */
  getActiveHistory: (sessionType: string = 'TEXTO') =>
    api.get<Message[]>('/api/conversations/active-history', { params: { sessionType } }),

  /** Lista de conversaciones de un usuario */
  getConversations: (userId: number) =>
    api.get<Conversation[]>(`/api/conversations/user/${userId}`),

  /** Inicia una sesión de voz con un saludo de la IA */
  initiateConversation: (emotion: EmotionType, type: string = 'VIDEO') =>
    api.post<Message>('/api/conversations/initiate', { emotion, tipo: type }),

  /** Cierra la sesión activa actual para empezar una nueva */
  closeActiveSession: (userId: number, sessionType: string = 'TEXTO') =>
    api.post<void>('/api/conversations/active/close', null, { params: { userId, sessionType } }),

  /** Elimina permanentemente una sesión del historial */
  deleteSession: (conversationId: number) =>
    api.delete<void>(`/api/conversations/${conversationId}`),

  /** Obtiene los mensajes de una sesión pasada por su ID */
  getSessionMessages: (conversationId: number) =>
    api.get<Message[]>(`/api/conversations/history/${conversationId}`),
}

// ── Emotion ───────────────────────────────────────────────────────────────────
export const emotionService = {
  /** Registra una emoción detectada */
  register: (userId: number, type: EmotionType, intensity: number) =>
    api.post<Emotion>('/api/emotions', { userId, emotionType: type, intensity }),

  /** Última emoción registrada por el usuario */
  getLatest: (userId: number) =>
    api.get<EmotionType>(`/api/emotions/latest/${userId}`),

  /** Historial completo de emociones */
  getHistory: (userId: number) =>
    api.get<Emotion[]>(`/api/emotions/history/${userId}`),
}

// ── Memory ────────────────────────────────────────────────────────────────────
export const memoryService = {
  /** Guarda un nuevo recuerdo/memoria */
  saveMemory: (userId: number, content: string, associatedEmotion: EmotionType) =>
    api.post<UserMemory>('/api/memories', null, { params: { userId, content, associatedEmotion } }),

  /** Obtiene la lista de memorias de un usuario */
  getMemories: (userId: number) =>
    api.get<UserMemory[]>(`/api/memories/${userId}`),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardService = {
  /** Resumen general del usuario (DashboardController → /api/dashboard/{id}) */
  getSummary: (userId: number) =>
    api.get<DashboardSummary>(`/api/dashboard/${userId}`),

  /** Estadísticas detalladas (StatisticsController → /api/statistics/{id}) */
  getStatistics: (userId: number) =>
    api.get<DashboardSummary>(`/api/statistics/${userId}`),
}

// ── User Profile ───────────────────────────────────────────────────────────────
export const userService = {
  /** Obtiene el perfil de usuario */
  getProfile: (userId: number) =>
    api.get<UserProfile>(`/api/users/${userId}`),

  /** Actualiza las preferencias (espera JSON en formato string) */
  updatePreferences: (userId: number, preferences: string) =>
    api.put<UserProfile>(`/api/users/${userId}/preferences`, { preferences }),
}

// ── Intervention ────────────────────────────────────────────────────────────
export const interventionService = {
  /** Recomendaciones por emoción */
  getRecommendations: (emotion: EmotionType) =>
    api.get<Recommendation[]>(`/api/intervention/${emotion}`),

  /** Ejercicios terapéuticos */
  suggestExercises: (emotion: EmotionType) =>
    api.get<Recommendation[]>('/api/therapy/exercises', { params: { emotion } }),
}

// ── Aliases de Compatibilidad ─────────────────────────────────────────────────
export const conversacionService = conversationService;
export const emocionService = emotionService;
export const intervencionService = interventionService;

export default api
