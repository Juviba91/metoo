import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

const state: { mock: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))

// `redirect()` corta la ejecución lanzando: se imita para poder comprobar que
// la acción no sigue adelante después de redirigir.
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
vi.mock('next/headers', () => ({ headers: async () => new Map() }))

const { deleteAccount } = await import('@/app/auth/actions')

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'user-1' }, ...spec })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteAccount', () => {
  it('borra la cuenta llamando a la función de la base de datos', async () => {
    const mock = setup()

    await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT')

    expect(mock.rpcCalls.map((c) => c.name)).toContain('eliminar_mi_cuenta')
  })

  it('cierra la sesión, porque la cookie sobrevive al borrado del usuario', async () => {
    const mock = setup()

    await expect(deleteAccount()).rejects.toThrow('NEXT_REDIRECT')

    expect(mock.client.auth.signOut).toHaveBeenCalled()
  })

  it('exige sesión y no llama a la base de datos sin ella', async () => {
    const mock = setup({ user: null })

    const res = await deleteAccount()

    expect(res.error).toBeTruthy()
    expect(mock.rpcCalls).toHaveLength(0)
  })

  it('no cierra la sesión ni redirige si el borrado falla', async () => {
    const mock = setup({ rpc: { eliminar_mi_cuenta: { error: { message: 'boom' } } } })

    const res = await deleteAccount()

    expect(res.error).toBeTruthy()
    expect(mock.client.auth.signOut).not.toHaveBeenCalled()
  })
})
