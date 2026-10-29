/**
 * El embudo de metoo: dónde se queda la gente entre registrarse y tener una
 * conversación de verdad.
 *
 * Sin esto no se sabía si el problema era que nadie se registraba, que nadie
 * completaba el perfil o que nadie escribía. Cada paso cuenta personas, no
 * filas, y las cuentas de prueba (@test.local) no cuentan.
 */
export type EntradaEmbudo = {
  usuarios: { id: string; email: string | null; email_confirmed_at?: string | null }[]
  perfiles: { id: string; deleted_at: string | null }[]
  conexiones: { id: string; seeker_id: string; volunteer_id: string }[]
  mensajes: { connection_id: string; sender_id: string }[]
}

export type PasoEmbudo = { paso: string; personas: number }

/** Mensajes por cada lado para contar una conversación «de verdad». */
const MINIMO_POR_LADO = 2

export function calcularEmbudo({ usuarios, perfiles, conexiones, mensajes }: EntradaEmbudo): PasoEmbudo[] {
  const reales = usuarios.filter((u) => !(u.email ?? '').endsWith('@test.local'))
  const idsReales = new Set(reales.map((u) => u.id))
  const conPerfil = new Set(perfiles.filter((p) => !p.deleted_at && idsReales.has(p.id)).map((p) => p.id))

  const conexionesReales = conexiones.filter((c) => idsReales.has(c.seeker_id))
  const pidieron = new Set(conexionesReales.map((c) => c.seeker_id))

  const porConexion = new Map<string, { seeker: number; volunteer: number }>()
  const conexionPorId = new Map(conexionesReales.map((c) => [c.id, c]))
  for (const m of mensajes) {
    const c = conexionPorId.get(m.connection_id)
    if (!c) continue
    const cuenta = porConexion.get(c.id) ?? { seeker: 0, volunteer: 0 }
    if (m.sender_id === c.seeker_id) cuenta.seeker++
    else if (m.sender_id === c.volunteer_id) cuenta.volunteer++
    porConexion.set(c.id, cuenta)
  }

  const respondidos = new Set<string>()
  const conversaron = new Set<string>()
  for (const c of conexionesReales) {
    const cuenta = porConexion.get(c.id)
    if (!cuenta) continue
    if (cuenta.volunteer > 0) respondidos.add(c.seeker_id)
    if (cuenta.seeker >= MINIMO_POR_LADO && cuenta.volunteer >= MINIMO_POR_LADO) conversaron.add(c.seeker_id)
  }

  return [
    { paso: 'Se registran', personas: reales.length },
    { paso: 'Confirman el correo', personas: reales.filter((u) => u.email_confirmed_at).length },
    { paso: 'Completan el perfil', personas: conPerfil.size },
    { paso: 'Piden hablar con alguien', personas: pidieron.size },
    { paso: 'Reciben respuesta', personas: respondidos.size },
    { paso: 'Tienen una conversación (2+ mensajes por lado)', personas: conversaron.size },
  ]
}
