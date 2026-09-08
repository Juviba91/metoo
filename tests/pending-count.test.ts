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

const { contarSolicitudesPendientes } = await import('@/app/safety/actions')

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'vol-1' }, ...spec })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('contarSolicitudesPendientes', () => {
  it('cuenta en una sola ida y vuelta', async () => {
    // El filtro de bloqueados lo hace la propia función SQL. Antes eran dos
    // llamadas encadenadas, y cada pestaña las pagaba antes de pintar.
    const mock = setup({ rpc: { get_pending_count: { data: 3 } } })

    expect(await contarSolicitudesPendientes()).toBe(3)
    expect(mock.rpcCalls.map((c) => c.name)).toEqual(['get_pending_count'])
    expect(mock.filtros).toHaveLength(0)
  })

  it('no pide por su cuenta la lista de bloqueados', async () => {
    const mock = setup({ rpc: { get_pending_count: { data: 0 } } })

    await contarSolicitudesPendientes()

    expect(mock.rpcCalls.map((c) => c.name)).not.toContain('blocked_user_ids')
  })

  it('devuelve 0 sin sesión, sin preguntar a la base', async () => {
    const mock = setup({ user: null })

    expect(await contarSolicitudesPendientes()).toBe(0)
    expect(mock.rpcCalls).toHaveLength(0)
  })

  it('devuelve 0 si la consulta falla, en vez de romper la pestaña', async () => {
    setup({ rpc: { get_pending_count: { error: { message: 'boom' } } } })

    expect(await contarSolicitudesPendientes()).toBe(0)
  })
})
