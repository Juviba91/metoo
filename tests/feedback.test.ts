import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

const state: { mock: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))

const { submitFeedback, submitSuggestion } = await import('@/app/actions')

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'user-1' }, ...spec })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('submitFeedback', () => {
  it('guarda el mensaje recortado', async () => {
    const mock = setup()

    const res = await submitFeedback('  la app va lenta  ')

    expect(res.success).toBe(true)
    expect(mock.payloadOf('feedback', 'insert')).toEqual({
      profile_id: 'user-1',
      content: 'la app va lenta',
    })
  })

  it('rechaza un mensaje vacío sin tocar la base', async () => {
    const mock = setup()

    expect((await submitFeedback('   ')).error).toBeTruthy()
    expect(mock.didCall('feedback', 'insert')).toBe(false)
  })

  it('rechaza mensajes larguísimos: el maxLength solo vive en el navegador', async () => {
    const mock = setup()

    const res = await submitFeedback('a'.repeat(1001))

    expect(res.error).toBeTruthy()
    expect(mock.didCall('feedback', 'insert')).toBe(false)
  })

  it('no le devuelve al usuario el error crudo de Postgres', async () => {
    setup({ responses: { 'feedback.insert': { error: { message: 'null value in column "x"' } } } })

    const res = await submitFeedback('hola')

    expect(res.error).toBeTruthy()
    expect(res.error).not.toContain('column')
  })

  it('exige sesión', async () => {
    const mock = setup({ user: null })

    expect((await submitFeedback('hola')).error).toBeTruthy()
    expect(mock.didCall('feedback', 'insert')).toBe(false)
  })
})

describe('submitSuggestion', () => {
  it('guarda la sugerencia recortada', async () => {
    const mock = setup()

    const res = await submitSuggestion('  #duelo perinatal  ')

    expect(res.success).toBe(true)
    expect(mock.payloadOf('hashtag_suggestions', 'insert')).toEqual({
      profile_id: 'user-1',
      suggestion: '#duelo perinatal',
    })
  })

  it('rechaza sugerencias larguísimas', async () => {
    const mock = setup()

    expect((await submitSuggestion('a'.repeat(101))).error).toBeTruthy()
    expect(mock.didCall('hashtag_suggestions', 'insert')).toBe(false)
  })
})
