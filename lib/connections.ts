export type ConexionListada = {
  id: string
  status: string
  seeker_id?: string | null
  volunteer_id?: string | null
}

export type Rol = 'seeker' | 'volunteer'

/** La otra persona de la conversación, vista desde `rol`. */
export function otraParte(conexion: ConexionListada, rol: Rol): string | null {
  return (rol === 'seeker' ? conexion.volunteer_id : conexion.seeker_id) ?? null
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
