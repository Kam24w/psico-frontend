import { TipoEmocion } from '../types/domain';

const contextosEmocionales: Record<TipoEmocion, string> = {
  'FELIZ': 'feliz',
  'TRISTE': 'triste',
  'ESTRESADO': 'estresado',
  'ENOJADO': 'enojado',
  'ANSIOSO': 'ansioso',
  'SORPRENDIDO': 'sorprendido',
  'NEUTRAL': 'neutral'
};

export const getPromptForGemma4 = (emocion: TipoEmocion, mensaje: string) => {
  const contexto = contextosEmocionales[emocion] || 'neutral';

  return {
    system: `Eres un psicólogo virtual. Responde SOLO con tu mensaje al usuario, en español, máximo 2 frases. No escribas razonamientos, opciones ni análisis.`,
    user: `El usuario se siente ${contexto}. Dijo: "${mensaje}". Respóndele directamente.`
  };
};
