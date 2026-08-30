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
 * `upsert(..., { ignoreDuplicates: true })` se traduce a
 * `ON CONFLICT DO NOTHING`, y en Postgres esa forma NO devuelve las filas en
 * conflicto por RETURNING. Verificado contra Postgres 17:
 *
 *   INSERT ... ON CONFLICT (slug) DO NOTHING RETURNING id  -> 0 filas
 *
 * Así que `.select('id').single()` sobre un hashtag YA EXISTENTE falla con
 * PGRST116 en vez de devolver el hashtag.
 */
const NO_ROWS = {
  data: null,
  error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
}

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({
    user: { id: 'user-1' },
    ...spec,
    responses: {
      'posts.insert': { data: { id: 'post-1' } },
      ...spec.responses,
    },
  })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createPost: enlazado de hashtags', () => {
  it('enlaza un hashtag NUEVO (el upsert sí devuelve fila)', async () => {
    const mock = setup({
      responses: { 'hashtags.upsert': { data: { id: 'ht-nuevo' } } },
    })

    const result = await createPost('Mi primera vez #EsteEsNuevo')

    expect(result.success).toBe(true)
    expect(mock.didCall('post_hashtags', 'upsert')).toBe(true)
  })

  it('enlaza un hashtag YA EXISTENTE (p.ej. #Cáncer, de la lista curada)', async () => {
    const mock = setup({
      responses: {
        // El slug 'cancer' ya existe -> DO NOTHING -> 0 filas
        'hashtags.upsert': NO_ROWS,
        // ...pero la fila está en la tabla y una SELECT sí la encuentra
        'hashtags.select': { data: { id: 'ht-cancer' } },
      },
    })

    const result = await createPost('Hablo de mi experiencia con #Cáncer')

    expect(result.success).toBe(true)
    // El post debe quedar enlazado al hashtag existente para ser encontrable
    expect(mock.didCall('post_hashtags', 'upsert')).toBe(true)
  })
})
