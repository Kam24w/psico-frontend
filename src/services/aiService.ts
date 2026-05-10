import axios from 'axios';
import { TipoEmocion } from '../types/domain';
import { getPromptForGemma4 } from './aiPrompts';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemma-4-26b-a4b-it';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

/**
 * Elimina patrones de razonamiento interno que Gemma 4 a veces filtra en el texto.
 * Ej: líneas que empiezan con "*", "User says:", "Instruction X:", etc.
 */
function limpiarRespuesta(texto: string): string {
  const lineas = texto.split('\n');

  const lineasLimpias = lineas.filter(linea => {
    const t = linea.trim();
    if (!t) return false;
    // Descartar líneas de razonamiento/análisis interno
    if (/^\*\s/.test(t)) return false;                      // Viñetas con *
    if (/^-\s/.test(t)) return false;                       // Viñetas con -
    if (/^(User says|Instruction \d|El usuario dijo)/i.test(t)) return false;
    if (/^(Brief\?|Spanish\?|Step \d|Paso \d)/i.test(t)) return false;
    if (/^\d+\.\s/.test(t)) return false;                   // Listas numeradas
    if (/^\[.*\]$/.test(t)) return false;                   // [etiquetas]
    return true;
  });

  const resultado = lineasLimpias.join(' ').replace(/\s+/g, ' ').trim();

  // Si quedó vacío tras la limpieza, devolver el texto original sin procesar
  return resultado || texto.trim();
}

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
          maxOutputTokens: 1024
        }
      });

      const parts: any[] = response.data?.candidates?.[0]?.content?.parts ?? [];

      // 1. Filtrar partes de "thinking" internas marcadas por el modelo
      const textoCrudo = parts
        .filter((p: any) => p.thought !== true && typeof p.text === 'string')
        .map((p: any) => (p.text as string).trim())
        .join(' ')
        .trim();

      // 2. Limpiar patrones de razonamiento que puedan filtrarse en el texto
      const textoFinal = limpiarRespuesta(textoCrudo);

      return textoFinal || 'Lo siento, no pude procesar tu mensaje.';

    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error.message;
      console.error('Error Gemma 4:', msg);
      return 'Lo siento, intenta de nuevo.';
    }
  }
};
