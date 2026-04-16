export interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

export interface AuthPayload {
  token: string;
  usuarioId: number;
  nombre: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

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

export type RemitenteMensaje = 'AI' | 'USER';

export interface Mensaje {
  id: number;
  contenido: string;
  remitente: RemitenteMensaje;
  emocionAsociada: TipoEmocion | null;
  fecha: string;
}
