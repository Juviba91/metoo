import { describe, it, expect } from 'vitest'
import {
  candidatosPara,
  conversacionesVisiblesDe,
  esDoble,
  ladosDe,
  otraPersonaDe,
  puedeIniciar,
  puedenConectar,
  rolEn,
  temasDelLado,
  temasVisibles,
} from '@/lib/lados'

const solo = (r: 'seeker' | 'volunteer') => ladosDe(r, [{ role: r }])
const doble = ladosDe('volunteer', [{ role: 'volunteer' }, { role: 'seeker' }])

describe('ladosDe', () => {
  it('una cuenta de siempre tiene un solo lado', () => {
    expect(solo('seeker')).toEqual({ busca: true, acompana: false })
    expect(solo('volunteer')).toEqual({ busca: false, acompana: true })
  })

  it('el papel principal cuenta aunque no haya temas', () => {
    expect(ladosDe('volunteer', [])).toEqual({ busca: false, acompana: true })
  })

  it('un tema del otro lado la deja a los dos', () => {
    expect(doble).toEqual({ busca: true, acompana: true })
    expect(esDoble(doble)).toBe(true)
  })

  it('el papel principal no se pierde aunque todos los temas sean del otro lado', () => {
    const l = ladosDe('seeker', [{ role: 'volunteer' }])
    expect(l).toEqual({ busca: true, acompana: true })
  })

  it('ignora valores que no son un papel', () => {
    expect(ladosDe('admin', [{ role: 'otro' }, { role: null }])).toEqual({ busca: false, acompana: false })
  })
})

describe('quién puede escribir a quién', () => {
  it('quien busca inicia con quien acompaña, y no al revés', () => {
    expect(puedeIniciar(solo('seeker'), solo('volunteer'))).toBe(true)
    expect(puedeIniciar(solo('volunteer'), solo('seeker'))).toBe(false)
  })

  it('dos del mismo lado no se pueden escribir', () => {
    expect(puedenConectar(solo('seeker'), solo('seeker'))).toBe(false)
    expect(puedenConectar(solo('volunteer'), solo('volunteer'))).toBe(false)
  })

  it('quien está a los dos lados conecta con cualquiera de los dos', () => {
    expect(puedeIniciar(doble, solo('volunteer'))).toBe(true)
    expect(puedeIniciar(solo('seeker'), doble)).toBe(true)
    expect(puedenConectar(doble, solo('seeker'))).toBe(true)
  })
})

describe('temasVisibles', () => {
  const temas = [
    { slug: 'prematuros', role: 'volunteer' },
    { slug: 'duelo', role: 'seeker' },
  ]

  it('a quien busca solo se le enseña lo que ofrece la otra persona', () => {
    expect(temasVisibles(solo('seeker'), temas).map((t) => t.slug)).toEqual(['prematuros'])
  })

  it('a quien acompaña solo se le enseña lo que busca la otra persona', () => {
    expect(temasVisibles(solo('volunteer'), temas).map((t) => t.slug)).toEqual(['duelo'])
  })

  it('a quien está a los dos lados se le enseña todo', () => {
    expect(temasVisibles(doble, temas)).toHaveLength(2)
  })

  it('con un único lado en cada cuenta no filtra nada', () => {
    const todos = [{ role: 'volunteer' }, { role: 'volunteer' }]
    expect(temasVisibles(solo('seeker'), todos)).toHaveLength(2)
  })

  it('temasDelLado se queda con los de ese lado', () => {
    expect(temasDelLado('seeker', temas).map((t) => t.slug)).toEqual(['duelo'])
  })
})

describe('candidatosPara', () => {
  const ana = { id: 'ana', role: 'volunteer', profile_hashtags: [{ role: 'volunteer' }] }
  const bea = { id: 'bea', role: 'seeker', profile_hashtags: [{ role: 'seeker' }] }
  const eva = { id: 'eva', role: 'volunteer', profile_hashtags: [{ role: 'volunteer' }, { role: 'seeker' }] }
  const todos = [ana, bea, eva]

  it('quien busca ve a quien acompaña, incluida quien también busca', () => {
    const { voluntarios, buscadores } = candidatosPara(solo('seeker'), todos)
    expect(voluntarios.map((p) => p.id)).toEqual(['ana', 'eva'])
    expect(buscadores).toEqual([])
  })

  it('quien acompaña ve a quien busca, incluida quien también acompaña', () => {
    const { voluntarios, buscadores } = candidatosPara(solo('volunteer'), todos)
    expect(buscadores.map((p) => p.id)).toEqual(['bea', 'eva'])
    expect(voluntarios).toEqual([])
  })

  it('quien está a los dos lados ve las dos listas', () => {
    const { voluntarios, buscadores } = candidatosPara(doble, todos)
    expect(voluntarios.map((p) => p.id)).toEqual(['ana', 'eva'])
    expect(buscadores.map((p) => p.id)).toEqual(['bea', 'eva'])
  })
})

describe('conversaciones de quien está a los dos lados', () => {
  const YO = 'yo'
  const hechasPorMi = { id: 'c1', status: 'rejected', seeker_id: YO, volunteer_id: 'ana' }
  const rechazadasPorMi = { id: 'c2', status: 'rejected', seeker_id: 'bea', volunteer_id: YO }
  const aceptada = { id: 'c3', status: 'accepted', seeker_id: 'bea', volunteer_id: YO }
  const conBloqueado = { id: 'c4', status: 'accepted', seeker_id: YO, volunteer_id: 'malo' }

  it('mi papel depende de la conversación, no de mi cuenta', () => {
    expect(rolEn(hechasPorMi, YO)).toBe('seeker')
    expect(rolEn(aceptada, YO)).toBe('volunteer')
  })

  it('la otra persona es la del otro lado de cada conversación', () => {
    expect(otraPersonaDe(hechasPorMi, YO).id).toBe('ana')
    expect(otraPersonaDe(aceptada, YO).id).toBe('bea')
  })

  it('esconde las rechazadas que pedí yo, pero no las que rechacé yo', () => {
    const visibles = conversacionesVisiblesDe([hechasPorMi, rechazadasPorMi, aceptada], YO, [])
    expect(visibles.map((c) => c.id)).toEqual(['c2', 'c3'])
  })

  it('esconde a los bloqueados en los dos sentidos y conserva el orden', () => {
    const visibles = conversacionesVisiblesDe([aceptada, conBloqueado, rechazadasPorMi], YO, ['malo'])
    expect(visibles.map((c) => c.id)).toEqual(['c3', 'c2'])
  })
})
