import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// La pantalla del logo llega en el mismo HTML que la página: mientras se ve,
// la app ya está pintada debajo. Cada milisegundo que se queda es espera pura.
// Con 900 ms (y medio segundo quieta) tapaba el inicio hasta ~1,2 s cuando
// estaba listo a los ~0,4 s.
const css = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8')

describe('pantalla de apertura', () => {
  it('se va en 300 ms como mucho', () => {
    const m = css.match(/#app-splash\s*\{[^}]*animation:\s*metoo-splash-out\s+(\d+)ms/)
    expect(m).not.toBeNull()
    expect(Number(m![1])).toBeLessThanOrEqual(300)
  })

  it('empieza a irse desde el primer fotograma, sin pausa', () => {
    const keyframes = css.match(/@keyframes metoo-splash-out\s*\{([\s\S]*?)\n\}/)
    expect(keyframes).not.toBeNull()
    // Un tramo tipo «0%, 55% { opacity: 1 }» es una pausa con el logo quieto.
    expect(keyframes![1]).not.toMatch(/0%\s*,\s*\d+%/)
  })
})
