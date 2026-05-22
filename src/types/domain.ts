// ── Auth ─────────────────────────────────────────────────────────────────────

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

/** Mapeado del AuthResponse del backend */
export interface AuthPayload {
  token: string;
  userId: number;
  name: string;
  email: string;
  rol?: string;
  // Aliases para compatibilidad interna del frontend
  usuarioId?: number;
  nombre?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  /** Nombre completo — el backend lo recibe como "name" */
  name: string;
  email: string;
  password: string;
}

// ── Emociones ─────────────────────────────────────────────────────────────────

export type TipoEmocion =
  | 'FELIZ'
  | 'TRISTE'
  | 'ESTRESADO'
  | 'ENOJADO'
  | 'ANSIOSO'
  | 'SORPRENDIDO'
  | 'NEUTRAL';

export interface EmocionDetectada {
  tipo: TipoEmocion;
  intensidad: number;
  raw?: string;
}

/** Registro de emoción guardado en BD (EmotionController → /api/emotions) */
export interface Emotion {
  id: number;
  userId: number;
  emotionType: TipoEmocion;
  intensity: number;
  registeredAt: string;
}

// ── Mensajes ─────────────────────────────────────────────────────────────────

export type RemitenteMensaje = 'AI' | 'USER';

/**
 * Mensaje normalizado para uso interno en el frontend.
 * Los campos "content/sender/associatedEmotion/createdAt" vienen del backend (MensajeResponse).
 * Mantenemos alias opcionales para el mensaje de bienvenida local.
 */
export interface Mensaje {
  id: number;
  content: string;
  sender: RemitenteMensaje;
  associatedEmotion: TipoEmocion | null;
  createdAt: string;
}

// ── Conversaciones ────────────────────────────────────────────────────────────

/** ConversacionResponse del backend */
export interface Conversacion {
  id: number;
  userId: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  tipo?: string; // 'TEXTO' | 'VIDEO'
}

// ── Intervenciones ────────────────────────────────────────────────────────────

export interface Recomendacion {
  id: number;
  titulo: string;
  descripcion: string;
  estadoInicial: TipoEmocion;
  prioridad: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalConversaciones: number;
  totalMensajes: number;
  emocionMasFrecuente: TipoEmocion | null;
  ultimaConversacionId: number | null;
}
