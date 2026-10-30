import { describe, expect, it } from 'vitest'
import { PASOS_ALTA, destinoConRol, dondeSeQuedan, rolDeParam } from '@/lib/alta'

describe('orden del alta', () => {
  it('empieza por el papel y deja normas y edad para el final', () => {
    expect(PASOS_ALTA[0]).toBe('Tu papel')
    expect(PASOS_ALTA[PASOS_ALTA.length - 1]).toBe('Normas y edad')
  })
})

describe('rol desde la portada', () => {
  it('solo acepta los dos papeles', () => {
    expect(rolDeParam('seeker')).toBe('seeker')
    expect(rolDeParam('volunteer')).toBe('volunteer')
    expect(rolDeParam('admin')).toBeNull()
    expect(rolDeParam(null)).toBeNull()
  })

  it('un enlace de vuelta manda sobre el papel', () => {
    expect(destinoConRol('/dashboard/chat/1', 'seeker')).toBe('/dashboard/chat/1')
  })

  it('sin enlace, al alta con el papel elegido', () => {
    expect(destinoConRol(null, 'volunteer')).toBe('/onboarding?rol=volunteer')
    expect(destinoConRol(null, null)).toBeNull()
  })
})

describe('dónde se quedan', () => {
  it('cuenta solo cuentas reales sin perfil, por paso', () => {
    const r = dondeSeQuedan(
      [
        { id: 'a', email: 'a@gmail.com' },
        { id: 'b', email: 'b@gmail.com' },
        { id: 'c', email: 'c@gmail.com' },
        { id: 'd', email: 'd@test.local' },
        { id: 'e', email: 'e@gmail.com' },
      ],
      new Set(['e']),
      [
        { user_id: 'a', paso: 5 },
        { user_id: 'b', paso: 1 },
        { user_id: 'd', paso: 2 },
        { user_id: 'e', paso: 3 },
      ],
    )
    const de = Object.fromEntries(r.map((x) => [x.paso, x.personas]))
    expect(de['Normas y edad']).toBe(1)
    expect(de['Tu papel']).toBe(1)
    expect(de['Tus temas']).toBe(0)
    expect(de['Sin dato (de antes, o no abrió el asistente)']).toBe(1)
  })
})
