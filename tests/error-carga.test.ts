import { describe, it, expect } from 'vitest'
import { esErrorDeVersion, puedeRecargarSola } from '@/lib/error-carga'

describe('esErrorDeVersion', () => {
  it('reconoce los fallos de una pestaña de antes de publicar', () => {
    const chunk = Object.assign(new Error('Loading chunk 123 failed.'), { name: 'ChunkLoadError' })
    expect(esErrorDeVersion(chunk)).toBe(true)
    expect(esErrorDeVersion(new TypeError('Failed to fetch dynamically imported module: /_next/x.js'))).toBe(true)
    expect(esErrorDeVersion(new Error('Failed to find Server Action "abc". This request might be from an older or newer deployment.'))).toBe(true)
  })
  it('un fallo cualquiera no se toma por versión vieja', () => {
    expect(esErrorDeVersion(new TypeError("Cannot read properties of undefined (reading 'alias')"))).toBe(false)
    expect(esErrorDeVersion(undefined)).toBe(false)
  })
})

describe('puedeRecargarSola', () => {
  const ahora = 1_800_000_000_000
  it('la primera vez, sí', () => {
    expect(puedeRecargarSola(null, ahora)).toBe(true)
  })
  it('si ya se recargó hace menos de un minuto, no: evita el bucle', () => {
    expect(puedeRecargarSola(String(ahora - 10_000), ahora)).toBe(false)
  })
  it('pasado el minuto, otra vez sí', () => {
    expect(puedeRecargarSola(String(ahora - 61_000), ahora)).toBe(true)
  })
})
