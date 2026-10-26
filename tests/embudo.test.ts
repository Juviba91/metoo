import { describe, it, expect } from 'vitest'
import { calcularEmbudo } from '@/lib/embudo'

describe('calcularEmbudo', () => {
  it('cuenta personas por paso y deja fuera las cuentas de prueba', () => {
    const pasos = calcularEmbudo({
      usuarios: [
        { id: 'a', email: 'a@gmail.com', email_confirmed_at: 'x' },
        { id: 'b', email: 'b@gmail.com', email_confirmed_at: 'x' },
        { id: 'c', email: 'c@gmail.com', email_confirmed_at: null },
        { id: 'v', email: 'v@gmail.com', email_confirmed_at: 'x' },
        { id: 't', email: 'falso@test.local', email_confirmed_at: 'x' },
      ],
      perfiles: [
        { id: 'a', deleted_at: null },
        { id: 'b', deleted_at: null },
        { id: 'v', deleted_at: null },
        { id: 't', deleted_at: null },
      ],
      conexiones: [
        { id: 'c1', seeker_id: 'a', volunteer_id: 'v' },
        { id: 'c2', seeker_id: 'a', volunteer_id: 'v2' },
        { id: 'c3', seeker_id: 'b', volunteer_id: 'v' },
        { id: 'c4', seeker_id: 't', volunteer_id: 'v' },
      ],
      mensajes: [
        { connection_id: 'c1', sender_id: 'a' },
        { connection_id: 'c1', sender_id: 'v' },
        { connection_id: 'c1', sender_id: 'a' },
        { connection_id: 'c1', sender_id: 'v' },
        { connection_id: 'c3', sender_id: 'b' },
        { connection_id: 'c4', sender_id: 'v' },
      ],
    })

    expect(pasos.map((p) => p.personas)).toEqual([4, 3, 3, 2, 1, 1])
  })
})
