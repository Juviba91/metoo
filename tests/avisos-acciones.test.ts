import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

const state: { mock: ReturnType<typeof createSupabaseMock> } = { mock: createSupabaseMock() }

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/app/safety/actions', () => ({
  canInteractWith: async () => true,
  checkRateLimit: async () => ({ allowed: true, remaining: 4 }),
}))

const { pedirAvisoTema, quitarAvisoTema, marcarGuiaVoluntarioLeida } = await import('@/app/dashboard/actions')

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'user-1' }, ...spec })
  return state.mock
}

beforeEach(() => vi.clearAllMocks())

describe('avisos por tema', () => {
  it('pide aviso a nombre propio, sin duplicar si ya estaba', async () => {
    const mock = setup()

    const res = await pedirAvisoTema('h-duelo')

    expect(res.success).toBe(true)
    expect(mock.payloadOf('avisos_tema', 'upsert')).toEqual({ profile_id: 'user-1', hashtag_id: 'h-duelo' })
  })

  it('quita solo el aviso propio de ese tema', async () => {
    const mock = setup()

    await quitarAvisoTema('h-duelo')

    expect(mock.didCall('avisos_tema', 'delete')).toBe(true)
    expect(mock.filtros.filter((f) => f.table === 'avisos_tema').map((f) => f.args)).toEqual([
      ['profile_id', 'user-1'],
      ['hashtag_id', 'h-duelo'],
    ])
  })

  it('sin sesión no toca nada', async () => {
    const mock = createSupabaseMock({ user: null })
    state.mock = mock

    expect((await pedirAvisoTema('h')).error).toBeTruthy()
    expect(mock.calls).toEqual([])
  })
})

describe('guía para quien acompaña', () => {
  it('se marca por la función de la base', async () => {
    const mock = setup()

    await marcarGuiaVoluntarioLeida()

    expect(mock.rpcCalls.map((c) => c.name)).toEqual(['marcar_guia_voluntario_leida'])
  })
})
