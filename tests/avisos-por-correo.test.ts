import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Los correos de aviso no llevan el contenido de los mensajes. Pasan por
 * Resend y por el buzón de quien los recibe, donde se ven en la pantalla de
 * bloqueo del móvil: en una app donde se habla de un diagnóstico o de un duelo,
 * eso es justo lo que no tiene que salir. La política de privacidad lo afirma.
 *
 * La función vive en Deno y aquí no se ejecuta, así que se vigila el código.
 */
const FUNCIONES = join(process.cwd(), 'supabase', 'functions')
const leer = (nombre: string) => readFileSync(join(FUNCIONES, nombre, 'index.ts'), 'utf8')

describe('notify-message', () => {
  const codigo = leer('notify-message')

  it('no usa el texto del mensaje para construir el correo', () => {
    expect(codigo).not.toMatch(/message\.content/)
    expect(codigo).not.toMatch(/substring\(/)
    expect(codigo).not.toMatch(/blockquote/)
  })

  it('sigue avisando de quién escribe y dónde leerlo', () => {
    expect(codigo).toMatch(/safeAlias/)
    expect(codigo).toMatch(/chatUrl/)
  })
})

describe('pie de los avisos', () => {
  it.each(['notify-message', 'notify-connection'])(
    '%s manda a Ajustes, que es donde se desactivan',
    (nombre) => {
      const codigo = leer(nombre)
      expect(codigo).toMatch(/desactívalos en Ajustes/)
      expect(codigo).not.toMatch(/desactívalos en tu perfil/)
    },
  )
})
