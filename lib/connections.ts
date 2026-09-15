export type ParteConexion = { alias?: string | null; deleted_at?: string | null } | null

export type ConexionListada = {
  id: string
  status: string
  seeker_id?: string | null
  volunteer_id?: string | null
  seeker?: ParteConexion
  volunteer?: ParteConexion
}

export type Rol = 'seeker' | 'volunteer'

/** La otra persona de la conversación, vista desde `rol`. */
export function otraParte(conexion: ConexionListada, rol: Rol): string | null {
  return (rol === 'seeker' ? conexion.volunteer_id : conexion.seeker_id) ?? null
}

/** La ficha de la otra persona, vista desde `rol`. */
export function fichaOtraParte(conexion: ConexionListada, rol: Rol): ParteConexion {
  return (rol === 'seeker' ? conexion.volunteer : conexion.seeker) ?? null
}

/**
 * ¿La otra persona se dio de baja?
 *
 * La ficha no se borra al darse de baja: se queda con el alias y con
 * `deleted_at` puesto, para que la conversación siga teniendo sentido en vez
 * de esfumarse. Ver `20260916_baja_conserva_conversacion.sql`.
 */
export function otraParteDeBaja(conexion: ConexionListada, rol: Rol): boolean {
  return Boolean(fichaOtraParte(conexion, rol)?.deleted_at)
}

/**
 * ¿Se puede seguir escribiendo en esta conversación?
 *
 * No, si está rechazada o si al otro lado ya no hay nadie. Es lo mismo que
 * comprueba `sendMessage` en el servidor: aquí solo decide si se pinta el
 * campo de texto, porque esconderlo no impide nada por sí solo.
 */
export function conversacionAbierta(conexion: ConexionListada, rol: Rol): boolean {
  return conexion.status !== 'rejected' && !otraParteDeBaja(conexion, rol)
}

/**
 * Conversaciones que se le enseñan a alguien en su pantalla de inicio.
 *
 * Dos reglas:
 *
 * 1. Fuera las de gente bloqueada, en cualquiera de los dos sentidos.
 *
 * 2. A quien busca apoyo no se le enseñan las rechazadas. `requestConnection`
 *    ya evita nombrar el rechazo a propósito —«Esta persona no está disponible
 *    ahora mismo»—, pero luego le quedaba en el inicio una tarjeta roja que
 *    ponía «Cerrada», para siempre y sin nada que hacer con ella. El cuidado de
 *    no señalar a nadie se perdía en la pantalla siguiente.
 *
 *    Al voluntario sí se le siguen enseñando: es una decisión que tomó él.
 *
 * Que la otra persona se haya dado de baja NO esconde nada: justo lo que se
 * busca es que la conversación siga ahí, con su aviso, en vez de desaparecer.
 */
export function conversacionesVisibles<T extends ConexionListada>(
  conexiones: T[],
  rol: Rol,
  ocultos: Iterable<string>,
): T[] {
  const bloqueados = new Set(ocultos)

  return conexiones.filter((conexion) => {
    if (rol === 'seeker' && conexion.status === 'rejected') return false

    const otro = otraParte(conexion, rol)
    return !otro || !bloqueados.has(otro)
  })
}
