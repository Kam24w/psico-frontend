import axios from 'axios';
import { TipoEmocion } from '../types/domain';
import { getPromptForGemma4 } from './aiPrompts';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemma-4-26b-a4b-it';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export const aiService = {
  generarRespuesta: async (mensajeUsuario: string, emocion: TipoEmocion): Promise<string> => {
    if (!API_KEY) return 'Error de configuración de la IA.';

    const { system, user } = getPromptForGemma4(emocion, mensajeUsuario);

    try {
      const response = await axios.post(`${BASE_URL}?key=${API_KEY}`, {
        systemInstruction: {
          parts: [{ text: system }]
        },
        contents: [{
          role: 'user',
          parts: [{ text: user }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 80
        }
      });

      const parts: any[] = response.data?.candidates?.[0]?.content?.parts ?? [];

      // Solo toma partes que NO sean "thinking" interno del modelo
      const texto = parts
        .filter((p: any) => p.thought !== true && typeof p.text === 'string')
        .map((p: any) => (p.text as string).trim())
        .join(' ')
        .trim();

      return texto || 'Lo siento, no pude procesar tu mensaje.';

    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error.message;
      console.error('Error Gemma 4:', msg);
      return 'Lo siento, intenta de nuevo.';
    }
  }
};
