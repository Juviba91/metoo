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
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 10 })),
  getHiddenUserIds: vi.fn(async () => [] as string[]),
}
vi.mock('@/app/safety/actions', () => ({
  checkRateLimit: (...a: unknown[]) => safety.checkRateLimit(...(a as [])),
  getHiddenUserIds: (...a: unknown[]) => safety.getHiddenUserIds(...(a as [])),
}))

const { createPost } = await import('@/app/feed/actions')

/**
 * `crear_hashtag` devuelve SETOF, así que PostgREST manda un array. Da igual
 * que la etiqueta ya existiera o se acabe de crear: la función relee la fila
 * antes de devolverla, que es justo lo que antes había que parchear a mano en
 * cada sitio (`ON CONFLICT DO NOTHING` no devuelve la fila en conflicto).
 */
const HASHTAG_OK = { data: [{ id: 'ht-1', slug: 'x', label: 'X' }] }

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({
    user: { id: 'user-1' },
    ...spec,
    responses: {
      'posts.insert': { data: { id: 'post-1' } },
      ...spec.responses,
    },
    rpc: { crear_hashtag: HASHTAG_OK, ...spec.rpc },
  })
  return state.mock
}

const enlaces = (mock: ReturnType<typeof createSupabaseMock>) =>
  mock.calls.filter((c) => c.table === 'post_hashtags' && c.op === 'upsert').length

const etiquetasPedidas = (mock: ReturnType<typeof createSupabaseMock>) =>
  mock.rpcCalls
    .filter((c) => c.name === 'crear_hashtag')
    .map((c) => (c.args as { p_slug: string }).p_slug)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createPost: enlazado de hashtags', () => {
  it('enlaza la etiqueta que devuelve la base', async () => {
    const mock = setup()

    const result = await createPost('Mi primera vez #EsteEsNuevo')

    expect(result.success).toBe(true)
    expect(mock.didCall('post_hashtags', 'upsert')).toBe(true)
  })

  it('no escribe en `hashtags` directamente', async () => {
    // La tabla ya no acepta INSERT desde fuera: su política `WITH CHECK (true)`
    // dejaba a cualquiera con sesión llenar de basura el catálogo común, que es
    // el que se ofrece como sugerencia a todo el mundo.
    const mock = setup()

    await createPost('Hablo de mi experiencia con #Cáncer')

    expect(mock.didCall('hashtags', 'upsert')).toBe(false)
    expect(mock.didCall('hashtags', 'insert')).toBe(false)
    expect(etiquetasPedidas(mock)).toEqual(['cancer'])
  })

  it('sigue publicando aunque la etiqueta no se pueda crear', async () => {
    // Pasa de verdad al llegar al tope de etiquetas nuevas por hora: la RPC
    // devuelve error. El post ya está escrito y no se pierde por eso.
    const mock = setup({
      rpc: { crear_hashtag: { data: null, error: { message: 'Has creado demasiadas etiquetas nuevas.' } } },
    })

    const result = await createPost('Sigo adelante #EtiquetaNueva')

    expect(result.success).toBe(true)
    expect(enlaces(mock)).toBe(0)
  })
})

describe('createPost: límites del catálogo de hashtags', () => {
  it('no da de alta más de cinco etiquetas por publicación', async () => {
    const mock = setup()

    await createPost('#uno #dos #tres #cuatro #cinco #seis #siete #ocho #nueve #diez')

    expect(enlaces(mock)).toBe(5)
  })

  it('no cuenta dos veces la misma etiqueta repetida', async () => {
    const mock = setup()

    await createPost('#duelo hoy ha sido duro #duelo y mañana también #Duelo')

    expect(enlaces(mock)).toBe(1)
  })

  it('descarta etiquetas absurdamente largas antes de llamar a la base', async () => {
    const mock = setup()

    await createPost(`#${'a'.repeat(60)} #cancer`)

    expect(etiquetasPedidas(mock)).toEqual(['cancer'])
  })

  it('descarta una etiqueta de una sola letra', async () => {
    // La base exige dos caracteres. Si no se filtrase aquí, la RPC lanzaría
    // una excepción por cada `#a` suelto de una publicación.
    const mock = setup()

    await createPost('#a #cancer')

    expect(etiquetasPedidas(mock)).toEqual(['cancer'])
  })
})
