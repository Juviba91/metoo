import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MARCA_PLANTILLA, plantillaCorreo } from '../supabase/functions/_shared/email'

describe('plantillaCorreo', () => {
  it('envuelve el contenido con la marca, «metoo.» y el pie con el 112', () => {
    const html = plantillaCorreo('<p>Hola</p>')

    expect(html.startsWith(MARCA_PLANTILLA)).toBe(true)
    expect(html).toContain('<p>Hola</p>')
    expect(html).toContain('metoo<span')
    expect(html).toContain('llama al 112')
    expect(html).toContain('/dashboard/ajustes')
  })

  it('no envuelve dos veces lo que ya viene envuelto (lo encolado desde la base)', () => {
    const una = plantillaCorreo('<p>Hola</p>')

    expect(plantillaCorreo(una)).toBe(una)
  })

  // La misma plantilla vive en SQL (`plantilla_correo`) para lo que se encola
  // desde la base. Si se cambia una y no la otra, los correos salen distintos
  // según por dónde vayan.
  it('es la misma que la de la base de datos', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20261115_plantilla_correos.sql'), 'utf8')
    const [antes, despues] = plantillaCorreo('@@CONTENIDO@@').slice(MARCA_PLANTILLA.length).split('@@CONTENIDO@@')

    expect(sql).toContain(`'${antes}'`)
    expect(sql).toContain(`'${despues}'`)
  })
})
