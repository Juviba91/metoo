import { temasDelLado, type TemaConRol } from '@/lib/lados'

type Tema = TemaConRol & { hashtag_id: string; hashtags?: { id: string; slug: string; label: string } | null }
type Perfil = { profile_hashtags?: Tema[] | null }

/**
 * Los temas en los que busco apoyo y en los que ahora mismo no acompaña
 * nadie de la lista.
 *
 * Con pocos voluntarios, lo normal es que el tema de alguien esté vacío. Esa
 * persona veía una lista sin nadie de lo suyo y se iba. Para estos temas se le
 * ofrece «avísame cuando haya alguien» (tabla `avisos_tema`): no se pierde, y
 * se ve qué temas necesitan voluntarios.
 */
export function temasSinAcompanante<T extends Tema>(misTemas: T[], voluntarios: Perfil[]): T[] {
  const cubiertos = new Set(
    voluntarios.flatMap((v) => temasDelLado('volunteer', v.profile_hashtags ?? []).map((t) => t.hashtag_id)),
  )
  return temasDelLado('seeker', misTemas).filter((t) => !cubiertos.has(t.hashtag_id))
}
