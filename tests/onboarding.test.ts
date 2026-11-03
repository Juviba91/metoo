import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'
import { VERSION_TEXTOS_LEGALES } from '@/lib/legal'

const state: { mock: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))

// Cookies de la petición: aquí se guarda el bloqueo de 24 h a menores.
const jar = new Map<string, { value: string; maxAge?: number }>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n)!.value } : undefined),
    set: (n: string, value: string, o?: { maxAge?: number }) => jar.set(n, { value, maxAge: o?.maxAge }),
  }),
}))

const { completeOnboarding } = await import('@/app/onboarding/actions')

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'user-1' }, ...spec })
  return state.mock
}

const base = {
  role: 'seeker' as const,
  hashtags: [],
  alias: 'Ana',
  city: 'Madrid',
  bio: '',
  mayorDeEdad: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  jar.clear()
})

describe('completeOnboarding: consentimiento', () => {
  it('no crea el perfil si falta aceptar los textos', async () => {
    const mock = setup()

    const res = await completeOnboarding({ ...base, aceptaTextos: false, consentimientoSalud: true })

    expect(res.error).toBeTruthy()
    expect(mock.didCall('profiles', 'insert')).toBe(false)
  })

  it('no crea el perfil si falta el consentimiento de salud', async () => {
    const mock = setup()

    const res = await completeOnboarding({ ...base, aceptaTextos: true, consentimientoSalud: false })

    expect(res.error).toBeTruthy()
    expect(mock.didCall('profiles', 'insert')).toBe(false)
  })

  it('guarda cuándo se consintió y con qué versión de los textos', async () => {
    const mock = setup()

    const res = await completeOnboarding({ ...base, aceptaTextos: true, consentimientoSalud: true })

    expect(res.success).toBe(true)
    const insert = mock.calls.find((c) => c.table === 'profiles' && c.op === 'insert')
    const payload = insert?.payload as { consentimiento_en: string; consentimiento_version: string }
    expect(payload.consentimiento_version).toBe(VERSION_TEXTOS_LEGALES)
    expect(Number.isNaN(Date.parse(payload.consentimiento_en))).toBe(false)
  })

  it('guarda aparte el consentimiento de salud y que se comprobó la edad', async () => {
    const mock = setup()

    await completeOnboarding({ ...base, aceptaTextos: true, consentimientoSalud: true })

    const payload = mock.calls.find((c) => c.table === 'profiles' && c.op === 'insert')
      ?.payload as Record<string, unknown>
    expect(payload.consentimiento_salud_version).toBe(VERSION_TEXTOS_LEGALES)
    expect(Number.isNaN(Date.parse(String(payload.consentimiento_salud_en)))).toBe(false)
    expect(Number.isNaN(Date.parse(String(payload.edad_comprobada_en)))).toBe(false)
  })

})

describe('completeOnboarding: edad', () => {
  it('sin la casilla de 16 años o más no crea el perfil', async () => {
    const mock = setup()

    const res = await completeOnboarding({
      ...base,
      mayorDeEdad: false,
      aceptaTextos: true,
      consentimientoSalud: true,
    })

    expect(res.error).toMatch(/16 años/)
    expect(mock.didCall('profiles', 'insert')).toBe(false)
  })

  it('con la casilla marcada, sí', async () => {
    setup()

    const res = await completeOnboarding({ ...base, aceptaTextos: true, consentimientoSalud: true })

    expect(res.success).toBe(true)
  })
})

describe('completeOnboarding: papel por tema', () => {
  it('guarda el papel elegido en cada tema, y sin papel deja que la base ponga el de la cuenta', async () => {
    const mock = setup()

    await completeOnboarding({
      ...base,
      role: 'volunteer',
      hashtags: [
        { id: 'h-prem', slug: 'prematuros', label: 'Prematuros', role: 'volunteer' },
        { id: 'h-duelo', slug: 'duelo', label: 'Duelo', role: 'seeker' },
        { id: 'h-otro', slug: 'otro', label: 'Otro' },
        { id: 'h-raro', slug: 'raro', label: 'Raro', role: 'admin' },
      ],
      aceptaTextos: true,
      consentimientoSalud: true,
    })

    expect(mock.payloadOf('profile_hashtags', 'insert')).toEqual([
      { profile_id: 'user-1', hashtag_id: 'h-prem', role: 'volunteer' },
      { profile_id: 'user-1', hashtag_id: 'h-duelo', role: 'seeker' },
      { profile_id: 'user-1', hashtag_id: 'h-otro' },
      { profile_id: 'user-1', hashtag_id: 'h-raro' },
    ])
  })
})
