/**
 * Chat del equipo: la conversación entre metoo (Juan, desde el panel de admin)
 * y cada persona. Una por persona. Ver la migración 20261108.
 */
export const NOMBRE_EQUIPO = 'Equipo metoo'
export const LIMITE_MENSAJE_EQUIPO = 2000

export type ResultadoMensaje = { ok: true; valor: string } | { ok: false; error: string }

export function validarMensajeEquipo(texto: unknown): ResultadoMensaje {
  if (typeof texto !== 'string' || !texto.trim()) return { ok: false, error: 'Escribe un mensaje.' }
  const valor = texto.trim()
  if (valor.length > LIMITE_MENSAJE_EQUIPO) {
    return { ok: false, error: `El mensaje es demasiado largo (máximo ${LIMITE_MENSAJE_EQUIPO} caracteres).` }
  }
  return { ok: true, valor }
}

export type MensajeEquipo = { usuario_id: string; del_equipo: boolean; contenido: string; creado_en: string }
export type PerfilEquipo = { id: string; alias: string; role: string | null; city: string | null }

export type HiloEquipo = {
  id: string
  alias: string
  rol: string | null
  ciudad: string | null
  ultimo: MensajeEquipo | null
  /** El último mensaje es de la persona: le debes una respuesta. */
  esperando: boolean
}

/**
 * La lista del panel: a quién le debes respuesta primero, luego el resto de
 * conversaciones por lo más reciente, y al final las personas con las que aún
 * no has hablado (por alias), por si quieres escribirles tú.
 */
export function hilosDeEquipo(perfiles: PerfilEquipo[], mensajes: MensajeEquipo[]): HiloEquipo[] {
  const ultimos = new Map<string, MensajeEquipo>()
  for (const m of mensajes) {
    const actual = ultimos.get(m.usuario_id)
    if (!actual || m.creado_en > actual.creado_en) ultimos.set(m.usuario_id, m)
  }

  const hilos = perfiles.map<HiloEquipo>((p) => {
    const ultimo = ultimos.get(p.id) ?? null
    return {
      id: p.id,
      alias: p.alias,
      rol: p.role,
      ciudad: p.city,
      ultimo,
      esperando: ultimo !== null && !ultimo.del_equipo,
    }
  })

  const grupo = (h: HiloEquipo) => (h.esperando ? 0 : h.ultimo ? 1 : 2)
  return hilos.sort((a, b) => {
    if (grupo(a) !== grupo(b)) return grupo(a) - grupo(b)
    if (a.ultimo && b.ultimo) return b.ultimo.creado_en.localeCompare(a.ultimo.creado_en)
    return a.alias.localeCompare(b.alias, 'es')
  })
}
