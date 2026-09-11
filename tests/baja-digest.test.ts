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

const { darDeBaja } = await import('@/app/baja/[token]/actions')
const { toggleDigest } = await import('@/app/safety/actions')

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'user-1' }, ...spec })
  return state.mock
}

const filtro = (mock: ReturnType<typeof createSupabaseMock>, metodo: string) =>
  mock.filtros.find((f) => f.table === 'profiles' && f.metodo === metodo)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('darDeBaja', () => {
  it('funciona sin sesión: es quien pulsa el enlace del correo', async () => {
    const mock = setup({ user: null, rpc: { baja_resumen: { data: true } } })

    expect((await darDeBaja('un-token')).ok).toBe(true)
    expect(mock.rpcCalls).toEqual([{ name: 'baja_resumen', args: { p_token: 'un-token' } }])
  })

  it('no usa la service role: esta es la única ruta pública de la app', async () => {
    const mock = setup({ rpc: { baja_resumen: { data: true } } })

    await darDeBaja('un-token')

    // Si tocara la tabla directamente, haría falta esa clave. La función SQL
    // solo sabe apagar esa casilla de ese perfil.
    expect(mock.didCall('profiles', 'update')).toBe(false)
  })

  it('avisa si el token no corresponde a nadie', async () => {
    setup({ rpc: { baja_resumen: { data: false } } })

    expect((await darDeBaja('token-inventado')).ok).toBe(false)
  })

  it('avisa si la base falla, en vez de decir que se dio de baja', async () => {
    setup({ rpc: { baja_resumen: { error: { message: 'boom' } } } })

    expect((await darDeBaja('un-token')).ok).toBe(false)
  })
})

describe('toggleDigest', () => {
  it('guarda la preferencia del usuario con sesión', async () => {
    const mock = setup()

    const r = await toggleDigest(false)

    expect(r.success).toBe(true)
    expect(mock.payloadOf('profiles', 'update')).toEqual({ digest_enabled: false })
    expect(filtro(mock, 'eq')?.args).toEqual(['id', 'user-1'])
  })

  it('exige sesión', async () => {
    const mock = setup({ user: null })

    expect((await toggleDigest(false)).error).toBeTruthy()
    expect(mock.didCall('profiles', 'update')).toBe(false)
  })
})
