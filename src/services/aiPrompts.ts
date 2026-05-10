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
    system: [
      'Eres un psicólogo virtual empático que responde en español.',
      'REGLAS ESTRICTAS:',
      '1. Escribe ÚNICAMENTE tu respuesta final al usuario.',
      '2. Máximo 2 frases cortas y directas.',
      '3. PROHIBIDO escribir razonamientos, pasos, instrucciones, análisis, listas o viñetas.',
      '4. PROHIBIDO empezar con "User says", "Instruction", "El usuario" o cualquier formato de análisis.',
      '5. Dirígete directamente al usuario usando "tú".',
    ].join('\n'),
    user: `[Emoción detectada: ${contexto}]\nUsuario: "${mensaje}"\nResponde:`
  };
};
