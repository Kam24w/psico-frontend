/**
 * groqService.ts
 * Llama directamente a la API de Groq (OpenAI-compatible) desde el frontend.
 * Esto elimina el procesamiento de IA en el backend, ahorrando RAM del servidor.
 *
 * Modelo híbrido (igual que GroqAiAdapter en el backend):
 *   nivelRiesgo == 0  →  llama-3.1-8b-instant     (ultra rápido, voz fluida)
 *   nivelRiesgo  > 0  →  llama-3.3-70b-versatile  (más empático, momentos críticos)
 */

import type { TipoEmocion } from '../types/domain'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL_FAST = 'llama-3.1-8b-instant'
const MODEL_SAFE = 'llama-3.3-70b-versatile'

const FALLBACK_MSG = 'Lo siento, hubo un problema al procesar tu mensaje. ¿Puedes intentarlo de nuevo?'

// System prompt base del psicólogo virtual
function buildSystemPrompt(emocion: TipoEmocion): string {
  const emocionDesc: Record<TipoEmocion, string> = {
    FELIZ: 'El usuario se siente feliz y positivo.',
    TRISTE: 'El usuario se siente triste o melancólico. Muestra empatía y apoyo.',
    ESTRESADO: 'El usuario se siente estresado. Ofrece técnicas de relajación y apoyo.',
    ENOJADO: 'El usuario se siente enojado. Mantén la calma y valida sus emociones.',
    ANSIOSO: 'El usuario se siente ansioso. Ayuda a centrarse en el presente y calmar la mente.',
    SORPRENDIDO: 'El usuario está sorprendido. Muestra curiosidad y apertura.',
    NEUTRAL: 'El usuario está en un estado neutral. Crea un espacio seguro para explorar sus pensamientos.',
  }

  return `Eres un psicólogo virtual empático y profesional que brinda apoyo emocional en español. 
Tu nombre es "Psicólogo Virtual". Hablas de manera cálida, comprensiva y profesional.
Respondes siempre en español. Tus respuestas son concisas (máximo 3 oraciones) pero significativas.
${emocionDesc[emocion]}
No diagnosticas, pero sí acompañas, validas emociones y ofreces perspectivas saludables.`
}

// Calcula un nivel de riesgo básico basado en las palabras del mensaje
function detectarNivelRiesgo(mensaje: string): number {
  const palabrasAltoRiesgo = [
    'suicid', 'morir', 'muerte', 'matar', 'no quiero vivir',
    'hacerme daño', 'lastimarme', 'desesperado', 'sin esperanza'
  ]
  const lower = mensaje.toLowerCase()
  const hayRiesgo = palabrasAltoRiesgo.some(p => lower.includes(p))
  return hayRiesgo ? 5 : 0
}

async function llamarGroq(
  systemPrompt: string,
  userMessage: string,
  nivelRiesgo: number
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined

  if (!apiKey || apiKey === 'sin-configurar' || apiKey.trim() === '') {
    console.error('No se configuró VITE_GROQ_API_KEY en el .env del frontend.')
    return FALLBACK_MSG
  }

  const modelo = nivelRiesgo > 0 ? MODEL_SAFE : MODEL_FAST
  const temperature = nivelRiesgo > 0 ? 0.7 : 1.0

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelo,
        max_tokens: 512,
        temperature,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userMessage },
        ],
      }),
    })

    if (!res.ok) {
      console.error(`Groq API error: ${res.status} ${res.statusText}`)
      return FALLBACK_MSG
    }

    const json = await res.json()
    const content: string | undefined = json?.choices?.[0]?.message?.content
    return content?.trim() || FALLBACK_MSG

  } catch (err) {
    console.error('Error al llamar a Groq:', err)
    return FALLBACK_MSG
  }
}

// ── Funciones públicas ────────────────────────────────────────────────────────

/**
 * Envía un mensaje de chat al psicólogo virtual.
 * @param contenido  Texto del usuario
 * @param emocion    Emoción detectada por la cámara
 * @returns          Respuesta de texto de la IA
 */
export async function enviarMensajeIA(contenido: string, emocion: TipoEmocion): Promise<string> {
  const nivelRiesgo = detectarNivelRiesgo(contenido)
  const systemPrompt = buildSystemPrompt(emocion)
  return llamarGroq(systemPrompt, contenido, nivelRiesgo)
}

/**
 * Genera el saludo inicial de la sesión de voz.
 * @param emocion  Emoción detectada al iniciar la sesión
 * @returns        Saludo de la IA
 */
export async function iniciarSesionIA(emocion: TipoEmocion): Promise<string> {
  const systemPrompt = buildSystemPrompt(emocion)
  const inicioPorEmocion: Record<TipoEmocion, string> = {
    FELIZ:       '¡Hola! Veo que estás con buen ánimo hoy. ¿Qué te trae por aquí?',
    TRISTE:      'Hola. Noto que quizás estás pasando por un momento difícil. Estoy aquí para escucharte.',
    ESTRESADO:   'Hola. Parece que llevas un peso encima hoy. Tómate un respiro, estoy aquí contigo.',
    ENOJADO:     'Hola. Noto que algo te tiene molesto. Cuéntame, ¿qué pasó?',
    ANSIOSO:     'Hola. Parece que algo te preocupa. Vamos despacio, estoy aquí para acompañarte.',
    SORPRENDIDO: '¡Hola! Parece que ha pasado algo inesperado. ¿Quieres contarme?',
    NEUTRAL:     '¡Hola! Me alegra que estés aquí. ¿Cómo te encuentras hoy?',
  }
  const userTrigger = inicioPorEmocion[emocion]
  return llamarGroq(systemPrompt, userTrigger, 0)
}
