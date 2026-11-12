import { describe, it, expect } from 'vitest'
import { posiblesParejas, type PerfilPareja } from '@/lib/posibles-parejas'

const p = (id: string, role: string, extra: Partial<PerfilPareja> = {}): PerfilPareja => ({
  id,
  alias: id.toUpperCase(),
  role,
  is_active: true,
  deleted_at: null,
  ...extra,
})

const base = {
  perfiles: [p('s1', 'seeker'), p('v1', 'volunteer'), p('v2', 'volunteer')],
  temas: [
    { profile_id: 's1', role: 'seeker', tema: 'Duelo' },
    { profile_id: 'v1', role: 'volunteer', tema: 'Duelo' },
    { profile_id: 'v2', role: 'volunteer', tema: 'Cáncer' },
  ],
  conexiones: [],
  bloqueos: [],
}

describe('posiblesParejas', () => {
  it('empareja quien busca y quien acompaña en el mismo tema', () => {
    expect(posiblesParejas(base)).toEqual([
      { tema: 'Duelo', busca: { id: 's1', alias: 'S1' }, acompana: { id: 'v1', alias: 'V1', disponible: true } },
    ])
  })

  it('no repite parejas que ya tienen conversación, en cualquier sentido', () => {
    expect(posiblesParejas({ ...base, conexiones: [{ seeker_id: 'v1', volunteer_id: 's1' }] })).toEqual([])
  })

  it('no propone parejas con un bloqueo entre medias', () => {
    expect(posiblesParejas({ ...base, bloqueos: [{ blocker_id: 'v1', blocked_id: 's1' }] })).toEqual([])
  })

  it('el papel va por tema: una cuenta registrada como voluntaria puede buscar apoyo', () => {
    const r = posiblesParejas({
      ...base,
      temas: [...base.temas, { profile_id: 'v1', role: 'seeker', tema: 'Cáncer' }],
    })
    expect(r.map((x) => `${x.tema}:${x.busca.id}>${x.acompana.id}`)).toEqual(['Cáncer:v1>v2', 'Duelo:s1>v1'])
  })

  it('sin papel en el tema, cuenta el de la cuenta', () => {
    const r = posiblesParejas({ ...base, temas: base.temas.map((t) => ({ ...t, role: null })) })
    expect(r).toHaveLength(1)
  })

  it('fuera las cuentas dadas de baja y las de prueba', () => {
    expect(posiblesParejas({ ...base, perfiles: [p('s1', 'seeker', { deleted_at: '2026-01-01' }), p('v1', 'volunteer')] })).toEqual([])
    expect(posiblesParejas({ ...base, esPrueba: (id) => id === 'v1' })).toEqual([])
  })

  it('marca al voluntario no disponible y lo deja al final', () => {
    const r = posiblesParejas({
      ...base,
      perfiles: [p('s1', 'seeker'), p('v1', 'volunteer', { is_active: false }), p('v2', 'volunteer')],
      temas: [...base.temas, { profile_id: 's1', role: 'seeker', tema: 'Cáncer' }],
    })
    expect(r.map((x) => [x.acompana.id, x.acompana.disponible])).toEqual([
      ['v2', true],
      ['v1', false],
    ])
  })
})
