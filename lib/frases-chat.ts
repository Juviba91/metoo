/**
 * Frases para el primer mensaje.
 *
 * Con la app abierta y gente en la lista, nadie escribía: el primer mensaje a
 * un desconocido es la barrera, y más en mitad de un diagnóstico o un duelo.
 * Se ofrecen unas frases de opción cerrada (CLAUDE.md: nada de pedir más
 * texto libre) que se pueden enviar tal cual o retocar antes.
 *
 * Son genéricas a propósito: valen para cualquier tema y no obligan a contar
 * nada que identifique.
 */
export const FRASES_APERTURA = [
  'Hola. Me acaban de dar la noticia y no sé muy bien por dónde empezar.',
  'Hola. Estoy pasando por algo parecido a lo que viviste y me vendría bien hablar con alguien que lo entienda.',
  'Hola. No sé muy bien qué preguntar; solo necesitaba hablar con alguien que haya pasado por esto.',
  'Hola. ¿Cómo fueron para ti los primeros días?',
  'Hola. ¿Te puedo hacer una pregunta práctica sobre el hospital?',
] as const

/** Para quien acompaña, al contestar por primera vez. */
export const FRASES_RESPUESTA = [
  'Hola, gracias por escribirme. Yo pasé por algo parecido y aquí estoy para lo que necesites.',
  'Hola. Siento mucho que estés pasando por esto. Cuéntame lo que quieras, sin prisa.',
  'Hola. Me alegra que hayas escrito. ¿Cómo estás hoy?',
] as const
