import { conversacionesVisibles, type ConexionListada, type Rol } from '@/lib/connections'

export type { Rol }

/**
 * Una cuenta puede estar a los dos lados: acompañar en unos temas (los que ya
 * viviste) y buscar apoyo en otros (los que estás viviendo).
 *
 * El papel va por TEMA (`profile_hashtags.role`). `profiles.role` sigue siendo
 * el lado con el que te registraste, y no se puede dejar de ser: así una cuenta
 * de siempre, con todos sus temas del mismo papel, se comporta exactamente
 * igual que antes.
 *
 * Esto vive aquí, y no repartido por las pantallas, porque son ocho sitios los
 * que tienen que decidir lo mismo —quién sale en las listas, a quién se puede
 * escribir, qué temas se enseñan— y con la regla copiada ocho veces acaban
 * discrepando.
 */
export type TemaConRol = { role?: string | null }

export type Lados = { busca: boolean; acompana: boolean }

export function contrario(rol: Rol): Rol {
  return rol === 'seeker' ? 'volunteer' : 'seeker'
}

function esRol(valor: unknown): valor is Rol {
  return valor === 'seeker' || valor === 'volunteer'
}

/** Los lados de una cuenta: su papel principal más el de cada uno de sus temas. */
export function ladosDe(principal: string | null | undefined, temas: TemaConRol[] = []): Lados {
  const roles = new Set<Rol>()
  if (esRol(principal)) roles.add(principal)
  for (const tema of temas) if (esRol(tema.role)) roles.add(tema.role)
  return { busca: roles.has('seeker'), acompana: roles.has('volunteer') }
}

export function esDoble(lados: Lados): boolean {
  return lados.busca && lados.acompana
}

/** Quien busca apoyo inicia siempre la conversación: ¿puede `yo` escribir a `otro`? */
export function puedeIniciar(yo: Lados, otro: Lados): boolean {
  return yo.busca && otro.acompana
}

/** ¿Hay alguna forma de que estas dos cuentas hablen, en un sentido o en otro? */
export function puedenConectar(a: Lados, b: Lados): boolean {
  return puedeIniciar(a, b) || puedeIniciar(b, a)
}

/**
 * Los temas de `otro` que le corresponde ver a quien mira desde `yo`.
 *
 * Es lo que evita que alguien que te busca por un duelo vea también tus temas
 * de prematuros, y al revés: de cada persona solo sale aquello en lo que os
 * podéis ayudar. Con un único lado en cada cuenta no filtra nada.
 *
 * Es presentación, no control de acceso: la tabla es legible para cualquier
 * cuenta autenticada, igual que antes.
 */
export function temasVisibles<T extends TemaConRol>(yo: Lados, temas: T[]): T[] {
  const visibles = new Set<Rol>()
  if (yo.busca) visibles.add('volunteer')
  if (yo.acompana) visibles.add('seeker')
  // Una fila sin papel (no debería existir) se enseña: mejor de más que perderla.
  return temas.filter((tema) => !esRol(tema.role) || visibles.has(tema.role))
}

/** Los temas que una persona tiene del lado `lado`. */
export function temasDelLado<T extends TemaConRol>(lado: Rol, temas: T[]): T[] {
  return temas.filter((tema) => !esRol(tema.role) || tema.role === lado)
}

/** Mi papel en ESTA conversación, que no tiene por qué ser el de mi cuenta. */
export function rolEn(
  conexion: { seeker_id?: string | null; volunteer_id?: string | null },
  miId: string,
): Rol {
  return conexion.seeker_id === miId ? 'seeker' : 'volunteer'
}

/** La otra persona de la conversación, sea cual sea mi lado en ella. */
export function otraPersonaDe<T extends ConexionListada>(conexion: T, miId: string) {
  const rol = rolEn(conexion, miId)
  return {
    rol,
    id: (rol === 'seeker' ? conexion.volunteer_id : conexion.seeker_id) ?? null,
    ficha: (rol === 'seeker' ? conexion.volunteer : conexion.seeker) ?? null,
  }
}

/**
 * `conversacionesVisibles` aplicada con el papel de cada conversación.
 *
 * Quien está a los dos lados no tiene un único `rol` con el que filtrar: las
 * rechazadas solo se esconden en las que él pidió, y las que rechazó él las
 * sigue viendo. Se reutiliza la regla de siempre, ya probada, por mitades, y se
 * conserva el orden de entrada.
 */
export function conversacionesVisiblesDe<T extends ConexionListada>(
  conexiones: T[],
  miId: string,
  ocultos: Iterable<string>,
): T[] {
  const lista = [...ocultos]
  const comoBuscador = conexiones.filter((c) => rolEn(c, miId) === 'seeker')
  const comoVoluntario = conexiones.filter((c) => rolEn(c, miId) === 'volunteer')

  const quedan = new Set<string>([
    ...conversacionesVisibles(comoBuscador, 'seeker', lista).map((c) => c.id),
    ...conversacionesVisibles(comoVoluntario, 'volunteer', lista).map((c) => c.id),
  ])

  return conexiones.filter((c) => quedan.has(c.id))
}

type PerfilConTemas = { role?: string | null; profile_hashtags?: TemaConRol[] | null }

/**
 * Quién sale en cada lista de Inicio para quien mira con estos `lados`.
 *
 * `voluntarios` es a quien puede escribir si busca apoyo; `buscadores`, a quien
 * puede acompañar. Quien está a los dos lados ve las dos listas, y una persona
 * que también lo está puede salir en las dos.
 */
export function candidatosPara<T extends PerfilConTemas>(yo: Lados, perfiles: T[]) {
  const conLados = perfiles.map((perfil) => ({
    perfil,
    lados: ladosDe(perfil.role, perfil.profile_hashtags ?? []),
  }))

  return {
    voluntarios: yo.busca ? conLados.filter((c) => c.lados.acompana).map((c) => c.perfil) : [],
    buscadores: yo.acompana ? conLados.filter((c) => c.lados.busca).map((c) => c.perfil) : [],
  }
}
