import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

const state: { mock: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))

const revalidados: string[] = []
vi.mock('next/cache', () => ({
  revalidatePath: (ruta: string) => {
    revalidados.push(ruta)
  },
}))
vi.mock('@/app/safety/actions', () => ({
  canInteractWith: vi.fn(async () => true),
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 10 })),
}))

const { markConnectionRead } = await import('@/app/dashboard/actions')

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'user-1' }, ...spec })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
  revalidados.length = 0
})

describe('markConnectionRead', () => {
  it('marca la conversación como leída', async () => {
    const mock = setup()

    await markConnectionRead('conn-1')

    expect(mock.rpcCalls.map((c) => c.name)).toContain('mark_connection_read')
  })

  it('refresca las cuatro pestañas, o el globo se queda puesto', async () => {
    // El aviso lo pinta cada pestaña en el servidor, y con staleTimes a 30 s
    // volver atrás servía la versión cacheada: seguías viendo el globo de un
    // mensaje que acababas de leer.
    setup()

    await markConnectionRead('conn-1')

    expect(revalidados).toEqual(
      expect.arrayContaining(['/dashboard', '/dashboard/chats', '/dashboard/perfil', '/feed']),
    )
  })

  it('no refresca la ruta del chat, que lleva su propio estado en vivo', async () => {
    setup()

    await markConnectionRead('conn-1')

    expect(revalidados.some((r) => r.includes('/dashboard/chat/'))).toBe(false)
  })

  it('no refresca nada si la base de datos falla', async () => {
    setup({ rpc: { mark_connection_read: { error: { message: 'boom' } } } })

    await markConnectionRead('conn-1')

    expect(revalidados).toHaveLength(0)
  })
})
