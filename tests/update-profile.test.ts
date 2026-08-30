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
vi.mock('@/app/safety/actions', () => ({
  canInteractWith: async () => true,
  checkRateLimit: async () => ({ allowed: true, remaining: 10 }),
}))

const { updateProfile } = await import('@/app/dashboard/actions')

const TAGS = [
  { id: 'ht-1', slug: 'cancer', label: 'Cáncer' },
  { id: 'ht-2', slug: 'ictus', label: 'Ictus' },
]

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'user-1' }, ...spec })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateProfile: sync de hashtags', () => {
  it('añade los nuevos ANTES de borrar los que sobran', async () => {
    const mock = setup()

    await updateProfile({ alias: 'Ana', city: 'Madrid', bio: '', hashtags: TAGS })

    const ops = mock.calls
      .filter((c) => c.table === 'profile_hashtags')
      .map((c) => c.op)

    // Si el borrado va primero, un fallo al insertar deja al usuario sin
    // ningún hashtag. El orden importa.
    expect(ops).toEqual(['upsert', 'delete'])
  })

  it('no borra nada si falla el guardado de hashtags', async () => {
    const mock = setup({
      responses: { 'profile_hashtags.upsert': { error: { message: 'boom' } } },
    })

    const res = await updateProfile({ alias: 'Ana', city: 'Madrid', bio: '', hashtags: TAGS })

    expect(res.error).toBeTruthy()
    expect(mock.didCall('profile_hashtags', 'delete')).toBe(false)
  })

  it('deduplica ids repetidos antes de escribir', async () => {
    const mock = setup()

    await updateProfile({
      alias: 'Ana',
      city: 'Madrid',
      bio: '',
      hashtags: [...TAGS, TAGS[0]],
    })

    const payload = mock.payloadOf('profile_hashtags', 'upsert') as { hashtag_id: string }[]
    expect(payload.map((r) => r.hashtag_id)).toEqual(['ht-1', 'ht-2'])
  })

  it('vacía los hashtags cuando el usuario los quita todos', async () => {
    const mock = setup()

    await updateProfile({ alias: 'Ana', city: 'Madrid', bio: '', hashtags: [] })

    expect(mock.didCall('profile_hashtags', 'upsert')).toBe(false)
    expect(mock.didCall('profile_hashtags', 'delete')).toBe(true)
  })
})
