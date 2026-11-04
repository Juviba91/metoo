import { describe, it, expect } from 'vitest'
import { hilosDeEquipo, validarMensajeEquipo, LIMITE_MENSAJE_EQUIPO } from '@/lib/equipo'

describe('validarMensajeEquipo', () => {
  it('quita los espacios de los bordes', () => {
    expect(validarMensajeEquipo('  hola  ')).toEqual({ ok: true, valor: 'hola' })
  })

  it('rechaza lo vacío y lo que no es texto', () => {
    for (const v of ['', '   \n', null, undefined, 5]) {
      expect(validarMensajeEquipo(v).ok).toBe(false)
    }
  })

  it('rechaza lo que pasa del límite, que es el de la base', () => {
    expect(validarMensajeEquipo('a'.repeat(LIMITE_MENSAJE_EQUIPO)).ok).toBe(true)
    expect(validarMensajeEquipo('a'.repeat(LIMITE_MENSAJE_EQUIPO + 1)).ok).toBe(false)
  })
})

describe('hilosDeEquipo', () => {
  const perfiles = [
    { id: 'a', alias: 'Ana', role: 'seeker', city: 'Madrid' },
    { id: 'b', alias: 'Bea', role: 'volunteer', city: null },
    { id: 'c', alias: 'Carla', role: 'volunteer', city: null },
    { id: 'd', alias: 'Dani', role: 'seeker', city: null },
  ]
  const m = (usuario_id: string, del_equipo: boolean, creado_en: string) => ({ usuario_id, del_equipo, contenido: 'x', creado_en })

  it('primero a quien le debes respuesta, luego las demás conversaciones y al final quien no ha hablado', () => {
    const hilos = hilosDeEquipo(perfiles, [
      m('a', false, '2026-11-01T10:00:00Z'), // Ana escribió y no le has contestado
      m('b', true, '2026-11-03T10:00:00Z'), // a Bea le escribiste tú
      m('b', false, '2026-11-02T10:00:00Z'),
    ])
    expect(hilos.map((h) => h.alias)).toEqual(['Ana', 'Bea', 'Carla', 'Dani'])
    expect(hilos.map((h) => h.esperando)).toEqual([true, false, false, false])
  })

  it('por mensaje, vale el más reciente aunque lleguen desordenados', () => {
    const hilos = hilosDeEquipo(perfiles.slice(0, 1), [m('a', true, '2026-11-02T10:00:00Z'), m('a', false, '2026-11-01T10:00:00Z')])
    expect(hilos[0].esperando).toBe(false)
  })
})
