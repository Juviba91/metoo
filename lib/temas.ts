import type { Rol } from '@/lib/connections'

export type Tema = {
  id: string
  slug: string
  label: string
  /** Del rol contrario: con quién puedes hablar. */
  personas: number
  /** De tu mismo rol: quién más pasó por lo mismo. */
  companeros: number
  publicaciones: number
}

/** ¿Hay algo detrás de este tema, o está solo en el catálogo? */
export function temaTieneVida(tema: Tema): boolean {
  return tema.personas + tema.companeros + tema.publicaciones > 0
}

/**
 * Los temas con algo detrás arriba; los vacíos siguen estando, pero sin
 * ocupar la pantalla con ceros.
 *
 * Que los vacíos no desaparezcan importa: son el catálogo, y alguien tiene que
 * poder encontrar el suyo y ser el primero en ponérselo.
 */
export function partirTemas(temas: Tema[]): { conVida: Tema[]; vacios: Tema[] } {
  return {
    conVida: temas.filter(temaTieneVida),
    vacios: temas.filter((t) => !temaTieneVida(t)),
  }
}

/**
 * Cómo se lee cada cifra depende de quién mire.
 *
 * `personas` son siempre las del rol contrario, que es con quien puedes
 * hablar. `companeros` son las del tuyo: no puedes escribirles —la
 * conversación la abre quien busca apoyo y la acepta el voluntario, y eso no
 * se toca— pero saber que hay alguien más que pasó por lo mismo cuenta.
 */
export function textosTema(rol: Rol) {
  const plural = (n: number, uno: string, varios: string) =>
    n === 1 ? `1 ${uno}` : `${n} ${varios}`

  return rol === 'seeker'
    ? {
        personas: (n: number) => plural(n, 'voluntario', 'voluntarios'),
        companeros: (n: number) =>
          plural(n, 'persona más en lo mismo', 'personas más en lo mismo'),
        verPersonas: 'Ver quién puede acompañarte',
      }
    : {
        personas: (n: number) =>
          plural(n, 'persona buscando apoyo', 'personas buscando apoyo'),
        companeros: (n: number) => plural(n, 'voluntario más', 'voluntarios más'),
        verPersonas: 'Ver a quién puedes acompañar',
      }
}

export function textoPublicaciones(n: number): string {
  return n === 1 ? '1 publicación' : `${n} publicaciones`
}
