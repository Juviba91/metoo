import { describe, it, expect } from 'vitest'
import { declaraEdad } from '@/lib/edad'

describe('declaraEdad', () => {
  it('solo pasa con la casilla marcada', () => {
    expect(declaraEdad(true)).toEqual({ ok: true })
  })

  it('sin marcar, o con cualquier otra cosa, no deja seguir', () => {
    for (const v of [false, undefined, null, 'true', 1]) {
      expect(declaraEdad(v)).toMatchObject({ ok: false })
    }
  })
})
