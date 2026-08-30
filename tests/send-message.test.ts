import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

const state: { mock: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const safety = {
  canInteractWith: vi.fn(async () => true),
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 10 })),
}
vi.mock('@/app/safety/actions', () => ({
  canInteractWith: (...a: unknown[]) => safety.canInteractWith(...(a as [])),
  checkRateLimit: (...a: unknown[]) => safety.checkRateLimit(...(a as [])),
}))

const { sendMessage } = await import('@/app/dashboard/actions')

const CONN = { status: 'accepted', seeker_id: 'seeker-1', volunteer_id: 'vol-1' }

function setup(spec: MockSpec = {}) {
  // `...spec` va ANTES de `responses`: al revés, spec.responses machacaba el
  // objeto ya combinado y se perdían las respuestas por defecto.
  state.mock = createSupabaseMock({
    user: { id: 'seeker-1' },
    ...spec,
    responses: {
      'connections.select': { data: CONN },
      'messages.insert': { data: { id: 'msg-1', sender_id: 'seeker-1', content: 'hola', created_at: 'now' } },
      ...spec.responses,
    },
  })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
  safety.canInteractWith.mockResolvedValue(true)
  safety.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 10 })
})

describe('sendMessage', () => {
  it('envía un mensaje válido en una conexión propia', async () => {
    const mock = setup()
    const res = await sendMessage('conn-1', 'hola')

    expect(res.success).toBe(true)
    expect(mock.didCall('messages', 'insert')).toBe(true)
  })

  it('rechaza mensajes vacíos sin tocar la base de datos', async () => {
    const mock = setup()
    const res = await sendMessage('conn-1', '   ')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('messages', 'insert')).toBe(false)
  })

  it('rechaza mensajes de más de 2000 caracteres', async () => {
    const mock = setup()
    const res = await sendMessage('conn-1', 'a'.repeat(2001))

    expect(res.error).toBeTruthy()
    expect(mock.didCall('messages', 'insert')).toBe(false)
  })

  it('no permite escribir en una conexión ajena', async () => {
    const mock = setup({
      user: { id: 'intruso' },
      responses: { 'connections.select': { data: CONN } },
    })

    const res = await sendMessage('conn-1', 'hola')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('messages', 'insert')).toBe(false)
  })

  it('no permite escribir a un usuario bloqueado', async () => {
    safety.canInteractWith.mockResolvedValue(false)
    const mock = setup()

    const res = await sendMessage('conn-1', 'hola')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('messages', 'insert')).toBe(false)
  })

  it('no permite escribir en una conexión rechazada', async () => {
    const mock = setup({
      responses: { 'connections.select': { data: { ...CONN, status: 'rejected' } } },
    })

    const res = await sendMessage('conn-1', 'hola')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('messages', 'insert')).toBe(false)
  })

  it('comprueba el bloqueo contra la otra parte, no contra uno mismo', async () => {
    setup()
    await sendMessage('conn-1', 'hola')

    expect(safety.canInteractWith).toHaveBeenCalledWith('vol-1')
  })

  it('respeta el rate limit', async () => {
    safety.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 })
    const mock = setup()

    const res = await sendMessage('conn-1', 'hola')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('messages', 'insert')).toBe(false)
  })

  it('no consume rate limit si la petición no está autorizada', async () => {
    setup({ user: { id: 'intruso' } })
    await sendMessage('conn-1', 'hola')

    expect(safety.checkRateLimit).not.toHaveBeenCalled()
  })

  it('acepta automáticamente si el voluntario responde a una solicitud pendiente', async () => {
    const mock = setup({
      user: { id: 'vol-1' },
      responses: {
        'connections.select': { data: { ...CONN, status: 'pending' } },
        'connections.update': { data: null },
      },
    })

    await sendMessage('conn-1', 'hola')

    expect(mock.payloadOf('connections', 'update')).toEqual({ status: 'accepted' })
  })

  it('no auto-acepta si quien escribe es el seeker', async () => {
    const mock = setup({
      responses: { 'connections.select': { data: { ...CONN, status: 'pending' } } },
    })

    await sendMessage('conn-1', 'hola')

    expect(mock.didCall('connections', 'update')).toBe(false)
  })

  it('exige sesión', async () => {
    const mock = setup({ user: null })
    const res = await sendMessage('conn-1', 'hola')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('messages', 'insert')).toBe(false)
  })
})
