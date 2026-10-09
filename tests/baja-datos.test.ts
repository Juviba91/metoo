import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * La baja conserva la ficha como lápida, así que los `ON DELETE SET NULL` que
 * apuntan a `profiles` no saltan nunca y lo que cuelga de ella sigue ligado a
 * la persona. Cada vez que una migración redefine `eliminar_mi_cuenta` hay que
 * volver a escribir esos UPDATE: ya se perdieron una vez al reescribirla, y
 * este test existe para que no vuelva a pasar en silencio.
 */
const DIR = join(process.cwd(), 'supabase', 'migrations')

function ultimaDefinicion(): string {
  const ficheros = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort()
  const defs = ficheros
    .map((f) => readFileSync(join(DIR, f), 'utf8'))
    .flatMap((sql) => sql.match(/CREATE OR REPLACE FUNCTION public\.eliminar_mi_cuenta\(\)[\s\S]*?\$\$;/g) ?? [])
  return defs[defs.length - 1] ?? ''
}

describe('eliminar_mi_cuenta (última definición en las migraciones)', () => {
  const def = ultimaDefinicion()

  it('existe', () => {
    expect(def).toContain('eliminar_mi_cuenta')
  })

  it.each([
    ['las aportaciones a las guías', /UPDATE guia_respuestas SET autor_id = NULL/],
    ['quien hizo un reporte', /UPDATE reports SET reporter_id = NULL/],
    ['sobre quién era el reporte', /UPDATE reports SET reported_id = NULL/],
    ['la conversación a la que apuntaba el reporte', /UPDATE reports SET connection_id = NULL/],
    ['el feedback', /UPDATE feedback SET profile_id = NULL/],
    ['las sugerencias de etiquetas', /UPDATE hashtag_suggestions SET profile_id = NULL/],
  ])('desvincula %s', (_nombre, patron) => {
    expect(def).toMatch(patron)
  })

  it('sigue conservando la ficha como lápida y borrando el acceso', () => {
    expect(def).toMatch(/deleted_at = now\(\)/)
    expect(def).toMatch(/DELETE FROM auth\.users/)
  })
})
