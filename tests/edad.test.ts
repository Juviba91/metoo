import { describe, it, expect } from 'vitest'
import { comprobarEdad, edadEn } from '@/lib/edad'

const HOY = new Date(2026, 9, 14) // 14 de octubre de 2026, hora local

describe('edadEn', () => {
  it.each([
    ['2010-10-14', 16], // cumple hoy
    ['2010-10-15', 15], // cumple mañana
    ['2010-10-13', 16],
    ['1990-01-01', 36],
  ])('%s → %i', (fecha, años) => {
    expect(edadEn(fecha, HOY)).toBe(años)
  })

  it.each(['', '14/10/2010', '2010-02-30', '2027-01-01', '1890-01-01', 'mañana'])(
    'no acepta %j',
    (fecha) => {
      expect(edadEn(fecha, HOY)).toBeNull()
    },
  )
})

describe('comprobarEdad', () => {
  it('distingue al menor de la fecha mal escrita', () => {
    expect(comprobarEdad('2012-01-01', HOY)).toMatchObject({ ok: false, menor: true })
    expect(comprobarEdad('2012-13-01', HOY)).toMatchObject({ ok: false, menor: false })
    expect(comprobarEdad('2000-01-01', HOY)).toEqual({ ok: true })
  })
})
