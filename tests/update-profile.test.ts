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

describe('updateProfile: límites de los campos de texto', () => {
  it('no escribe nada si la bio pasa del límite', async () => {
    const mock = setup()

    const res = await updateProfile({
      alias: 'Ana',
      city: 'Madrid',
      bio: 'x'.repeat(301),
      hashtags: TAGS,
    })

    // El `maxLength` del formulario no lo ve quien llama a la server action
    // directamente, y la columna `bio` no tiene límite en la base.
    expect(res.error).toBeTruthy()
    expect(mock.didCall('profiles', 'update')).toBe(false)
    expect(mock.didCall('profile_hashtags', 'upsert')).toBe(false)
  })

  it('guarda el alias recortado', async () => {
    const mock = setup()

    await updateProfile({ alias: '  Ana  ', city: ' Madrid ', bio: '  ', hashtags: [] })

    expect(mock.payloadOf('profiles', 'update')).toMatchObject({
      alias: 'Ana',
      city: 'Madrid',
      bio: null,
    })
  })
})

describe('updateProfile: el papel de cada tema', () => {
  const CON_ROL = [
    { ...TAGS[0], role: 'volunteer' },
    { ...TAGS[1], role: 'seeker' },
  ]

  it('guarda el papel de cada tema, actualizando los que ya existían', async () => {
    const mock = setup()

    await updateProfile({ alias: 'Ana', city: 'Madrid', bio: '', hashtags: CON_ROL })

    expect(mock.payloadOf('profile_hashtags', 'upsert')).toEqual([
      { profile_id: 'user-1', hashtag_id: 'ht-1', role: 'volunteer' },
      { profile_id: 'user-1', hashtag_id: 'ht-2', role: 'seeker' },
    ])
    // Sin `ignoreDuplicates`: si el tema ya estaba, hay que escribirle el papel.
    const llamada = mock.calls.find((c) => c.table === 'profile_hashtags' && c.op === 'upsert')
    expect(llamada).toBeTruthy()
  })

  it('un tema sin papel solo se añade, y no pisa el que ya tuviera', async () => {
    const mock = setup()

    await updateProfile({ alias: 'Ana', city: 'Madrid', bio: '', hashtags: [CON_ROL[0], TAGS[1]] })

    const upserts = mock.calls.filter((c) => c.table === 'profile_hashtags' && c.op === 'upsert')
    expect(upserts).toHaveLength(2)
    expect(upserts[0].payload).toEqual([{ profile_id: 'user-1', hashtag_id: 'ht-1', role: 'volunteer' }])
    // El segundo no lleva `role`: así una pestaña abierta con el código anterior
    // no machaca el papel elegido.
    expect(upserts[1].payload).toEqual([{ profile_id: 'user-1', hashtag_id: 'ht-2' }])
  })

  it('descarta un papel inventado en vez de mandarlo a la base', async () => {
    const mock = setup()

    await updateProfile({
      alias: 'Ana',
      city: 'Madrid',
      bio: '',
      hashtags: [{ ...TAGS[0], role: 'admin' }],
    })

    const payload = mock.payloadOf('profile_hashtags', 'upsert') as Record<string, unknown>[]
    expect(payload).toEqual([{ profile_id: 'user-1', hashtag_id: 'ht-1' }])
  })

  it('con el papel repetido gana el último', async () => {
    const mock = setup()

    await updateProfile({
      alias: 'Ana',
      city: 'Madrid',
      bio: '',
      hashtags: [{ ...TAGS[0], role: 'volunteer' }, { ...TAGS[0], role: 'seeker' }],
    })

    expect(mock.payloadOf('profile_hashtags', 'upsert')).toEqual([
      { profile_id: 'user-1', hashtag_id: 'ht-1', role: 'seeker' },
    ])
  })
})
