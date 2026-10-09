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
}

beforeEach(() => {
  vi.clearAllMocks()
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
})
