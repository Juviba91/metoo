import type { Rol } from '@/lib/lados'

/**
 * Parejas que podrían hablar y todavía no lo han hecho: alguien que busca
 * apoyo en un tema y alguien que acompaña en ese mismo tema.
 *
 * Es para el panel de admin: con tan poca gente, cada pareja cuenta, y desde
 * el chat del equipo se le puede dar un empujón a quien busca («hay alguien
 * que pasó por lo mismo»).
 *
 * El papel va por tema (`profile_hashtags.role`), como en `ladosDe`; si una
 * fila no lo tiene, cuenta el papel con el que se registró la cuenta.
 */
export type PerfilPareja = {
  id: string
  alias: string | null
  role: string | null
  is_active: boolean | null
  deleted_at: string | null
}

export type Pareja = {
  tema: string
  busca: { id: string; alias: string }
  acompana: { id: string; alias: string; disponible: boolean }
}

export function posiblesParejas({
  perfiles,
  temas,
  conexiones,
  bloqueos,
  esPrueba = () => false,
}: {
  perfiles: PerfilPareja[]
  temas: { profile_id: string; role: string | null; tema: string | null }[]
  conexiones: { seeker_id: string | null; volunteer_id: string | null }[]
  bloqueos: { blocker_id: string | null; blocked_id: string | null }[]
  /** Las cuentas de prueba no cuentan: harían parecer que hay parejas que no existen. */
  esPrueba?: (id: string) => boolean
}): Pareja[] {
  const perfil = new Map(perfiles.filter((p) => !p.deleted_at && !esPrueba(p.id)).map((p) => [p.id, p]))

  const clave = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  const yaHablan = new Set(
    conexiones.filter((c) => c.seeker_id && c.volunteer_id).map((c) => clave(c.seeker_id!, c.volunteer_id!)),
  )
  const bloqueados = new Set(
    bloqueos.filter((b) => b.blocker_id && b.blocked_id).map((b) => clave(b.blocker_id!, b.blocked_id!)),
  )

  // Por tema: quién busca y quién acompaña.
  const porTema = new Map<string, Record<Rol, Set<string>>>()
  for (const t of temas) {
    const p = perfil.get(t.profile_id)
    if (!p || !t.tema) continue
    const rol = t.role ?? p.role
    if (rol !== 'seeker' && rol !== 'volunteer') continue
    if (!porTema.has(t.tema)) porTema.set(t.tema, { seeker: new Set(), volunteer: new Set() })
    porTema.get(t.tema)![rol].add(p.id)
  }

  const parejas: Pareja[] = []
  for (const [tema, lados] of porTema) {
    for (const s of lados.seeker) {
      for (const v of lados.volunteer) {
        if (s === v) continue
        const k = clave(s, v)
        if (yaHablan.has(k) || bloqueados.has(k)) continue
        const ps = perfil.get(s)!
        const pv = perfil.get(v)!
        parejas.push({
          tema,
          busca: { id: s, alias: ps.alias ?? '—' },
          acompana: { id: v, alias: pv.alias ?? '—', disponible: pv.is_active !== false },
        })
      }
    }
  }

  // Primero las que se pueden dar ya (voluntario disponible), luego por tema.
  return parejas.sort(
    (a, b) =>
      Number(b.acompana.disponible) - Number(a.acompana.disponible) || a.tema.localeCompare(b.tema, 'es'),
  )
}
