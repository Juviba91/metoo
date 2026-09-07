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

const filtroNot = (mock: ReturnType<typeof createSupabaseMock>) =>
  mock.filtros.find((f) => f.table === 'connections' && f.metodo === 'not')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('contarSolicitudesPendientes', () => {
  it('descuenta las solicitudes de gente bloqueada', async () => {
    // Esto es lo que hacía el dashboard y NO hacían el feed ni el perfil: el
    // número de la barra inferior bailaba entre pestañas.
    const mock = setup()

    await contarSolicitudesPendientes(['bloqueado-1', 'bloqueado-2'])

    expect(filtroNot(mock)?.args).toEqual([
      'seeker_id',
      'in',
      '(bloqueado-1,bloqueado-2)',
    ])
  })

  it('no añade el filtro si no hay nadie bloqueado', async () => {
    const mock = setup()

    await contarSolicitudesPendientes([])

    expect(filtroNot(mock)).toBeUndefined()
  })

  it('busca los bloqueos por su cuenta si no se los pasan', async () => {
    const mock = setup({ rpc: { blocked_user_ids: { data: [{ user_id: 'bloqueado-9' }] } } })

    await contarSolicitudesPendientes()

    expect(mock.rpcCalls.map((c) => c.name)).toContain('blocked_user_ids')
    expect(filtroNot(mock)?.args).toEqual(['seeker_id', 'in', '(bloqueado-9)'])
  })

  it('cuenta solo las pendientes de las que uno es voluntario', async () => {
    const mock = setup()

    await contarSolicitudesPendientes([])

    const igualdades = mock.filtros
      .filter((f) => f.table === 'connections' && f.metodo === 'eq')
      .map((f) => f.args)

    expect(igualdades).toEqual([
      ['volunteer_id', 'vol-1'],
      ['status', 'pending'],
    ])
  })

  it('devuelve 0 sin sesión, sin preguntar a la base', async () => {
    const mock = setup({ user: null })

    expect(await contarSolicitudesPendientes()).toBe(0)
    expect(mock.filtros).toHaveLength(0)
  })
})
