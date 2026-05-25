// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
}

/** Mapeado del AuthResponse del backend */
export interface AuthPayload {
  token: string;
  userId: number;
  name: string;
  email: string;
  role?: string;
  // Aliases para compatibilidad interna
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

export type EmotionType =
  | 'HAPPY'
  | 'SAD'
  | 'STRESSED'
  | 'ANGRY'
  | 'ANXIOUS'
  | 'SURPRISED'
  | 'NEUTRAL';

export interface DetectedEmotion {
  type: EmotionType;
  intensity: number;
  raw?: string;
}

/** Registro de emoción guardado en BD (EmotionController → /api/emotions) */
export interface Emotion {
  id: number;
  userId: number;
  emotionType: EmotionType;
  intensity: number;
  registeredAt: string;
}

// ── Mensajes ─────────────────────────────────────────────────────────────────

export type MessageSender = 'AI' | 'USER';

/**
 * Mensaje normalizado para uso interno en el frontend.
 * Los campos "content/sender/associatedEmotion/createdAt" vienen del backend (MensajeResponse).
 */
export interface Message {
  id: number;
  content: string;
  sender: MessageSender;
  associatedEmotion: EmotionType | null;
  createdAt: string;
}

// ── Conversaciones ────────────────────────────────────────────────────────────

/** ConversationResponse del backend */
export interface Conversation {
  id: number;
  userId: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  type?: string; // 'TEXTO' | 'VIDEO'
}

// ── Intervenciones ────────────────────────────────────────────────────────────

export interface Recommendation {
  id: number;
  title: string;
  description: string;
  initialState: EmotionType;
  priority: number;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  userId: number;
  activeConversations: number;
  savedMemories: number;
  emotionalTrend: number;
  latestAlert: string;
}

// ── Aliases de Compatibilidad para Refactorización Progresiva ─────────────────
export type Usuario = User;
export type TipoEmocion = EmotionType;
export type EmocionDetectada = DetectedEmotion;
export type RemitenteMensaje = MessageSender;
export type Mensaje = Message;
export type Conversacion = Conversation;
export type Recomendacion = Recommendation;
