import type { Rol } from '@/lib/lados'

/**
 * Los pasos del asistente de alta, en orden. El número es el que se guarda en
 * `alta_pasos` (ver la migración 20261104): si cambia el orden, cambia aquí y
 * el panel de admin lo lee bien sin tocar nada más.
 *
 * Normas, edad y consentimiento van AL FINAL a propósito. Antes eran lo
 * primero: un bloque de normas, la fecha de nacimiento y dos casillas legales
 * antes de nada personal, y de 12 cuentas 3 se quedaron en el asistente. Ahora
 * se empieza por lo que trae a cada uno (su papel y su tema), y lo legal se
 * acepta justo antes de crear el perfil, que es cuando se guarda algo.
 */
export const PASOS_ALTA = ['Tu papel', 'Tus temas', 'Tu momento', 'Tu perfil', 'Normas y edad'] as const

/** `?rol=` de la portada («Busco apoyo» / «Quiero ayudar»). Cualquier otra cosa, nada. */
export function rolDeParam(valor: string | null | undefined): Rol | null {
  return valor === 'seeker' || valor === 'volunteer' ? valor : null
}

/**
 * A dónde volver tras entrar. Si alguien venía de un enlace (`next`), ahí. Si
 * no, y pulsó «Busco apoyo» o «Quiero ayudar» en la portada, al alta con ese
 * papel ya elegido: si ya tiene perfil, /onboarding le manda al inicio.
 */
export function destinoConRol(next: string | null, rol: Rol | null): string | null {
  if (next) return next
  return rol ? `/onboarding?rol=${rol}` : null
}

export type CuentaSinPerfil = { id: string; email: string | null }

/**
 * Cuántas cuentas sin perfil se quedaron en cada paso del alta. Las que no
 * tienen paso guardado son de antes de guardarlo (o no llegaron a abrir el
 * asistente). Sin cuentas @test.local, como el embudo.
 */
export function dondeSeQuedan(
  usuarios: CuentaSinPerfil[],
  conPerfil: Set<string>,
  pasos: { user_id: string; paso: number }[],
): { paso: string; personas: number }[] {
  const pasoDe = new Map(pasos.map((p) => [p.user_id, p.paso]))
  const cuenta = new Array(PASOS_ALTA.length).fill(0)
  let sinDato = 0
  for (const u of usuarios) {
    if ((u.email ?? '').endsWith('@test.local') || conPerfil.has(u.id)) continue
    const paso = pasoDe.get(u.id)
    if (paso && paso >= 1 && paso <= PASOS_ALTA.length) cuenta[paso - 1]++
    else sinDato++
  }
  return [
    ...PASOS_ALTA.map((paso, i) => ({ paso, personas: cuenta[i] })),
    { paso: 'Sin dato (de antes, o no abrió el asistente)', personas: sinDato },
  ]
}
