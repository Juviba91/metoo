import { describe, it, expect } from 'vitest'
import { esAccionDeVersionVieja } from '@/components/aviso-version'

describe('esAccionDeVersionVieja', () => {
  it('reconoce el error de Next tras publicar', () => {
    expect(
      esAccionDeVersionVieja(
        new Error('Failed to find Server Action "abc". This request might be from an older or newer deployment.'),
      ),
    ).toBe(true)
  })

  it('no confunde otros errores', () => {
    expect(esAccionDeVersionVieja(new Error('Network error'))).toBe(false)
    expect(esAccionDeVersionVieja(undefined)).toBe(false)
  })
})
