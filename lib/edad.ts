/**
 * Comprobación de edad al registrarse (y al renovar el consentimiento).
 *
 * Una casilla: «Tengo 16 años o más». Sin marcarla no se puede seguir.
 *
 * Hubo un tiempo en que se pedía la fecha de nacimiento (nota legal de
 * octubre de 2026), con bloqueo de un día a quien declaraba menos. Juan la
 * quitó en noviembre: era fricción en el último paso del alta para todo el
 * mundo, y la casilla es lo mínimo que se puede pedir. Se sigue anotando cuándo
 * se declaró (`profiles.edad_comprobada_en`).
 */
export const EDAD_MINIMA = 16

export const AVISO_EDAD = `metoo es para personas de ${EDAD_MINIMA} años o más. Marca la casilla para continuar.`

export type ResultadoEdad = { ok: true } | { ok: false; error: string }

/** Solo vale un `true` explícito: lo que no se marca, no se da por hecho. */
export function declaraEdad(marcada: unknown): ResultadoEdad {
  return marcada === true ? { ok: true } : { ok: false, error: AVISO_EDAD }
}
