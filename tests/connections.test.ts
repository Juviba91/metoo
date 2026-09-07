import { describe, it, expect } from 'vitest'
import { conversacionesVisibles, otraParte } from '@/lib/connections'

const conexion = (id: string, status: string) => ({
  id,
  status,
  seeker_id: 'seeker-1',
  volunteer_id: 'vol-1',
})

describe('conversacionesVisibles', () => {
  it('no le enseña a quien busca apoyo las conversaciones rechazadas', () => {
    // `requestConnection` ya evita nombrar el rechazo («Esta persona no está
    // disponible ahora mismo»), pero luego quedaba una tarjeta roja fija en el
    // inicio que ponía «Cerrada».
    const conexiones = [conexion('a', 'accepted'), conexion('b', 'rejected')]

    const visibles = conversacionesVisibles(conexiones, 'seeker', [])

    expect(visibles.map((c) => c.id)).toEqual(['a'])
  })

  it('al voluntario sí se las enseña: la decisión fue suya', () => {
    const conexiones = [conexion('a', 'accepted'), conexion('b', 'rejected')]

    const visibles = conversacionesVisibles(conexiones, 'volunteer', [])

    expect(visibles.map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('esconde las de gente bloqueada, mire quien mire', () => {
    const conexiones = [conexion('a', 'accepted')]

    expect(conversacionesVisibles(conexiones, 'seeker', ['vol-1'])).toEqual([])
    expect(conversacionesVisibles(conexiones, 'volunteer', ['seeker-1'])).toEqual([])
  })

  it('deja pasar las pendientes de quien busca apoyo', () => {
    const conexiones = [conexion('a', 'pending')]

    expect(conversacionesVisibles(conexiones, 'seeker', [])).toHaveLength(1)
  })

  it('no descarta una conexión porque le falte el id de la otra parte', () => {
    const huerfana = { id: 'x', status: 'accepted', seeker_id: 'seeker-1', volunteer_id: null }

    expect(conversacionesVisibles([huerfana], 'seeker', ['vol-1'])).toHaveLength(1)
  })
})

describe('otraParte', () => {
  it('devuelve al voluntario si miras como quien busca apoyo, y al revés', () => {
    const c = conexion('a', 'accepted')

    expect(otraParte(c, 'seeker')).toBe('vol-1')
    expect(otraParte(c, 'volunteer')).toBe('seeker-1')
  })
})
