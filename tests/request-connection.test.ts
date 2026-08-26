import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

// El módulo real crea el cliente por petición; aquí se sustituye por el mock.
const state: { mock: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// canInteractWith y checkRateLimit viven en safety/actions; se controlan aparte
const safety = {
  canInteractWith: vi.fn(async () => true),
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
}
vi.mock('@/app/safety/actions', () => ({
  canInteractWith: (...a: unknown[]) => safety.canInteractWith(...(a as [])),
  checkRateLimit: (...a: unknown[]) => safety.checkRateLimit(...(a as [])),
}))

const { requestConnection } = await import('@/app/dashboard/actions')

function setup(spec: MockSpec) {
  state.mock = createSupabaseMock({ user: { id: 'seeker-1' }, ...spec })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
  safety.canInteractWith.mockResolvedValue(true)
  safety.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 })
})

describe('requestConnection', () => {
  it('crea la conexión cuando no existe ninguna', async () => {
    const mock = setup({
      responses: {
        'connections.select': { data: null },
        'connections.insert': { data: { id: 'conn-nueva' } },
      },
    })

    const res = await requestConnection('vol-1')

    expect(res).toEqual({ success: true, connectionId: 'conn-nueva' })
    expect(mock.didCall('connections', 'insert')).toBe(true)
  })

  it('no duplica si ya hay una conexión pendiente: devuelve la existente', async () => {
    const mock = setup({
      responses: { 'connections.select': { data: { id: 'conn-previa', status: 'pending' } } },
    })

    const res = await requestConnection('vol-1')

    expect(res).toEqual({ success: true, connectionId: 'conn-previa' })
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('no vuelve a solicitar si la conexión fue rechazada', async () => {
    const mock = setup({
      responses: { 'connections.select': { data: { id: 'conn-previa', status: 'rejected' } } },
    })

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(res.success).toBeUndefined()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('resuelve la carrera si otra petición creó la conexión a la vez', async () => {
    const mock = setup({
      responses: {
        // primero no existe; tras el 23505 la relectura sí la encuentra
        'connections.select': [{ data: null }, { data: { id: 'conn-carrera' } }],
        'connections.insert': { data: null, error: { code: '23505' } },
      },
    })

    const res = await requestConnection('vol-1')

    expect(res).toEqual({ success: true, connectionId: 'conn-carrera' })
    expect(mock.didCall('connections', 'insert')).toBe(true)
  })

  it('rechaza contactarse a uno mismo', async () => {
    const mock = setup({})
    const res = await requestConnection('seeker-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('no permite contactar a un usuario bloqueado', async () => {
    safety.canInteractWith.mockResolvedValue(false)
    const mock = setup({})

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('respeta el rate limit', async () => {
    safety.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 })
    const mock = setup({ responses: { 'connections.select': { data: null } } })

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('no consume rate limit cuando ya existía la conexión', async () => {
    setup({ responses: { 'connections.select': { data: { id: 'c1', status: 'pending' } } } })

    await requestConnection('vol-1')

    expect(safety.checkRateLimit).not.toHaveBeenCalled()
  })

  it('exige sesión', async () => {
    const mock = setup({ user: null })
    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })
})
