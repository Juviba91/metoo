import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Las pantallas de la app usan `<Pagina>` (components/pagina.tsx) en vez de
 * escribir su `<main>` a mano. Había 20 combinaciones de márgenes distintas y
 * cada pantalla nueva añadía la suya: esto lo para.
 *
 * Fuera quedan las que no son pantallas de la app: la portada, los textos
 * legales, el cartel para imprimir, el login y la pantalla de error.
 */
const EXENTAS = [
  'app/page.tsx',
  'app/privacidad/page.tsx',
  'app/terminos/page.tsx',
  'app/contacto/page.tsx',
  'app/guidelines/guidelines-content.tsx',
  'components/pantalla-error.tsx',
]

function ficheros(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? ficheros(p) : p.endsWith('.tsx') ? [p] : []
  })
}

describe('marco común de las pantallas', () => {
  it('ninguna pantalla de la app escribe su <main> a mano', () => {
    const raiz = process.cwd()
    const aMano = [...ficheros(join(raiz, 'app')), ...ficheros(join(raiz, 'components'))]
      .map((p) => relative(raiz, p))
      .filter((p) => !EXENTAS.includes(p) && p !== 'components/pagina.tsx')
      .filter((p) => /<main\s+className=/.test(readFileSync(join(raiz, p), 'utf8')))
    expect(aMano).toEqual([])
  })

  it('los títulos de pantalla no se esconden del todo en el móvil', () => {
    // `hidden` dejaba la página sin encabezado para los lectores de pantalla.
    const src = readFileSync(join(process.cwd(), 'components/pagina.tsx'), 'utf8')
    expect(src).toContain('sr-only sm:not-sr-only')
  })
})
