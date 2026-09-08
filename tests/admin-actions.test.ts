import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

const state: { mock: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))
// El panel usa el cliente con service role, que aquí es el mismo mock.
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => state.mock.client,
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

class RedirectError extends Error {
  constructor(public destino: string) {
    super('NEXT_REDIRECT')
  }
}
vi.mock('next/navigation', () => ({
  redirect: (destino: string) => {
    throw new RedirectError(destino)
  },
}))

const { eliminarComentario } = await import('@/app/admin/actions')

const ADMIN = { id: 'admin-1', email: 'baygual91@gmail.com' }

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: ADMIN, ...spec })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('eliminarComentario', () => {
  it('borra el feedback cuando lo pide el admin', async () => {
    const mock = setup()

    await eliminarComentario('feedback', 'fb-1')

    expect(mock.didCall('feedback', 'delete')).toBe(true)
  })

  it('borra también las sugerencias de hashtag', async () => {
    const mock = setup()

    await eliminarComentario('hashtag_suggestions', 'sg-1')

    expect(mock.didCall('hashtag_suggestions', 'delete')).toBe(true)
  })

  it('echa a quien no es admin, sin tocar la base', async () => {
    // Una server action es un endpoint: que el botón solo salga en /admin no
    // impide que alguien la llame directamente.
    const mock = setup({ user: { id: 'otro', email: 'cualquiera@gmail.com' } })

    await expect(eliminarComentario('feedback', 'fb-1')).rejects.toThrow('NEXT_REDIRECT')
    expect(mock.didCall('feedback', 'delete')).toBe(false)
  })

  it('echa a quien no ha iniciado sesión', async () => {
    const mock = setup({ user: null })

    await expect(eliminarComentario('feedback', 'fb-1')).rejects.toThrow('NEXT_REDIRECT')
    expect(mock.didCall('feedback', 'delete')).toBe(false)
  })

  it('no acepta una tabla que no sea una de las dos', async () => {
    const mock = setup()

    await expect(
      eliminarComentario('profiles' as 'feedback', 'x'),
    ).rejects.toThrow('Tabla no permitida')
    expect(mock.didCall('profiles', 'delete')).toBe(false)
  })
})
