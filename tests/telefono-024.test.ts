import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// El 024 es la línea de atención a la conducta suicida, no un teléfono general
// de ayuda. Solo puede salir donde se habla expresamente de quitarse la vida;
// en todo lo demás («si es urgente», «si lo necesitas») va el 112.
const PERMITIDOS = [
  'components/aviso-riesgo.tsx', // salta al escribir «quiero morirme» y similares (nota legal I-6)
  'lib/riesgo.ts',
  'app/terminos/page.tsx', // «si estás pensando en quitarte la vida»
  'app/guidelines/guidelines-content.tsx', // apartado «Línea 024 — conducta suicida» e ideas de hacerse daño
  'app/onboarding/wizard.tsx', // «si estás pensando en quitarte la vida»
  'app/dashboard/acompanar/page.tsx', // «si habla de quitarse la vida»
]

function ficheros(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? ficheros(p) : /\.(tsx?|sql)$/.test(f) ? [p] : []
  })
}

describe('teléfono 024', () => {
  it('solo aparece en los textos sobre riesgo de suicidio', () => {
    const con024 = ['app', 'components', 'lib', 'supabase/functions']
      .flatMap(ficheros)
      .filter((f) => /(^|[^\d])024([^\d]|$)/.test(readFileSync(f, 'utf8')))
    expect(con024.filter((f) => !PERMITIDOS.includes(f))).toEqual([])
  })
})
