import { describe, it, expect, vi } from 'vitest'
import { createSupabaseMock } from './helpers/supabase-mock'

const state = { mock: createSupabaseMock() }
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => state.mock.client }))

const { votarGuia } = await import('@/app/guias/actions')

describe('votarGuia', () => {
  it('vota por la función de la base, sin cuenta', async () => {
    state.mock = createSupabaseMock({ user: null })

    const res = await votarGuia('uci-neonatal', true)

    expect(res.success).toBe(true)
    expect(state.mock.rpcCalls).toEqual([
      { name: 'votar_guia_tema', args: { p_tema_slug: 'uci-neonatal', p_util: true } },
    ])
  })

  it('si la base falla, devuelve error', async () => {
    state.mock = createSupabaseMock({ rpc: { votar_guia_tema: { error: { message: 'x' } } } })

    expect((await votarGuia('b', false)).error).toBeTruthy()
  })
})
