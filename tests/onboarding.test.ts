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

const { completeOnboarding, comprobarEdadAlta } = await import('@/app/onboarding/actions')

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
  nacimiento: '1990-05-01',
}

/** Hace `años` años justos, en AAAA-MM-DD. */
function haceAnos(años: number, masDias = 0): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - años)
  d.setDate(d.getDate() + masDias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

  it('no guarda la fecha de nacimiento en ningún sitio', async () => {
    const mock = setup()

    await completeOnboarding({ ...base, aceptaTextos: true, consentimientoSalud: true })

    expect(JSON.stringify(mock.calls)).not.toContain('1990-05-01')
  })
})

describe('completeOnboarding: edad', () => {
  it('rechaza a quien tiene menos de 16 años y no crea el perfil', async () => {
    const mock = setup()

    const res = await completeOnboarding({
      ...base,
      nacimiento: haceAnos(16, 1),
      aceptaTextos: true,
      consentimientoSalud: true,
    })

    expect(res.error).toMatch(/16 años/)
    expect(mock.didCall('profiles', 'insert')).toBe(false)
  })

  it('acepta a quien cumple 16 hoy', async () => {
    setup()

    const res = await completeOnboarding({
      ...base,
      nacimiento: haceAnos(16),
      aceptaTextos: true,
      consentimientoSalud: true,
    })

    expect(res.success).toBe(true)
  })

  it('rechaza una fecha imposible', async () => {
    const mock = setup()

    const res = await completeOnboarding({
      ...base,
      nacimiento: '1990-02-31',
      aceptaTextos: true,
      consentimientoSalud: true,
    })

    expect(res.error).toBeTruthy()
    expect(mock.didCall('profiles', 'insert')).toBe(false)
  })

  it('tras declarar menos de 16, bloquea un día aunque se cambie el año', async () => {
    setup()

    const primero = await comprobarEdadAlta(haceAnos(14))
    expect(primero.error).toBeTruthy()
    expect(jar.get('mt_menor')?.maxAge).toBe(24 * 60 * 60)

    const segundo = await comprobarEdadAlta('1990-05-01')
    expect(segundo.error).toMatch(/16 años/)
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
