import { describe, it, expect } from 'vitest'
import { conversacionSinLeer } from '@/lib/sin-leer'

const conn = { status: 'accepted', seeker_id: 'yo', seeker_last_read_at: '2026-11-05T10:00:00Z', volunteer_last_read_at: null }
const de = (sender_id: string, created_at: string) => ({ sender_id, created_at })

describe('conversacionSinLeer', () => {
  it('la otra persona escribió después de que lo abriera: sin leer', () => {
    expect(conversacionSinLeer(conn, de('ana', '2026-11-05T11:00:00Z'), 'yo')).toBe(true)
  })
  it('lo escribió antes de abrirlo: leído', () => {
    expect(conversacionSinLeer(conn, de('ana', '2026-11-05T09:00:00Z'), 'yo')).toBe(false)
  })
  it('el último mensaje es mío: ya contesté', () => {
    expect(conversacionSinLeer(conn, de('yo', '2026-11-05T11:00:00Z'), 'yo')).toBe(false)
  })
  it('nunca la he abierto: sin leer', () => {
    expect(conversacionSinLeer({ ...conn, seeker_last_read_at: null }, de('ana', '2026-11-05T09:00:00Z'), 'yo')).toBe(true)
  })
  it('del lado del voluntario se mira su propia fecha, no la del otro', () => {
    const c = { status: 'pending', seeker_id: 'bea', seeker_last_read_at: '2026-11-06T00:00:00Z', volunteer_last_read_at: null }
    expect(conversacionSinLeer(c, de('bea', '2026-11-05T09:00:00Z'), 'yo')).toBe(true)
  })
  it('rechazada o sin mensajes: nada que avisar', () => {
    expect(conversacionSinLeer({ ...conn, status: 'rejected' }, de('ana', '2026-11-05T11:00:00Z'), 'yo')).toBe(false)
    expect(conversacionSinLeer(conn, undefined, 'yo')).toBe(false)
  })
})
