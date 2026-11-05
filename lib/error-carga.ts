/**
 * ¿El fallo es porque la pestaña es de una versión anterior de metoo?
 *
 * Si alguien deja metoo abierta y publicamos entretanto, la página vieja pide
 * trozos de código que ya no existen («ChunkLoadError») o acciones del servidor
 * retiradas. No es un fallo de la app: con recargar se arregla.
 */
export function esErrorDeVersion(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null | undefined
  const texto = `${e?.name ?? ''} ${e?.message ?? String(error ?? '')}`
  return /ChunkLoadError|Loading (CSS )?chunk|Failed to fetch dynamically imported module|Importing a module script failed|Failed to find Server Action|older or newer deployment/i.test(
    texto,
  )
}

/** Clave en sessionStorage con la hora de la última recarga automática. */
export const CLAVE_RECARGA = 'metoo:recarga-automatica'

/**
 * Recargar sola, pero una vez: si en el último minuto ya se recargó y vuelve a
 * fallar, el problema es otro y entrar en bucle sería peor que enseñar el
 * error.
 */
export function puedeRecargarSola(ultima: string | null, ahora: number): boolean {
  const t = Number(ultima)
  return !ultima || !Number.isFinite(t) || ahora - t > 60_000
}
