import { describe, expect, it } from 'vitest'
import { ladoQueInvitar } from '@/lib/lados'

const ahora = new Date('2026-11-03T12:00:00Z')

describe('ladoQueInvitar', () => {
  it('a quien acompaña le sugiere buscar apoyo, desde el primer día', () => {
    expect(ladoQueInvitar({ acompana: true, busca: false }, '2026-11-03T00:00:00Z', ahora)).toBe('buscar')
  })

  it('a quien busca apoyo no le pide acompañar al principio', () => {
    expect(ladoQueInvitar({ acompana: false, busca: true }, '2026-10-20T00:00:00Z', ahora)).toBeNull()
  })

  it('pasados 60 días, sí le invita a acompañar', () => {
    expect(ladoQueInvitar({ acompana: false, busca: true }, '2026-08-01T00:00:00Z', ahora)).toBe('acompanar')
  })

  it('a quien ya está a los dos lados, nada', () => {
    expect(ladoQueInvitar({ acompana: true, busca: true }, '2026-01-01T00:00:00Z', ahora)).toBeNull()
  })
})
