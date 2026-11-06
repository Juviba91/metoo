import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { cookiesDeSesion, sesionCaducada, sesionDe } from '@/lib/supabase/sesion'

const state: { error: unknown; claims: unknown } = { error: null, claims: null }
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getClaims: async () => ({ data: state.claims ? { claims: state.claims } : null, error: state.error }),
      getUser: async () => ({ data: { user: null } }),
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  }),
}))

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:1'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'x'
const { middleware } = await import('@/middleware')

const peticion = (ruta: string, cookie: string) =>
  new NextRequest(`http://localhost${ruta}`, { headers: { cookie } })

describe('sesión caducada', () => {
  const caducada = { code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found' }

  it('reconoce el error de un token de renovación que ya no existe', () => {
    expect(sesionCaducada(caducada)).toBe(true)
    expect(sesionCaducada({ message: 'Invalid Refresh Token: Already Used' })).toBe(true)
    expect(sesionCaducada({ code: 'session_not_found' })).toBe(true)
    expect(sesionCaducada({ code: 'over_request_rate_limit', message: 'rate limit' })).toBe(false)
    expect(sesionCaducada(null)).toBe(false)
  })

  it('distingue la cookie de sesión, también partida en trozos, de las demás', () => {
    expect(
      cookiesDeSesion(['sb-abc-auth-token', 'sb-abc-auth-token.0', 'sb-abc-auth-token.1', 'mt_consentimiento', 'sb-abc-auth-token-code-verifier']),
    ).toEqual(['sb-abc-auth-token', 'sb-abc-auth-token.0', 'sb-abc-auth-token.1'])
  })

  it('sesionDe avisa de que la cookie ya no vale', async () => {
    const cliente = { auth: { getClaims: async () => ({ data: null, error: caducada }) } } as never
    expect(await sesionDe(cliente)).toEqual({ usuario: null, caducada: true })

    const sinSesion = { auth: { getClaims: async () => ({ data: null, error: null }) } } as never
    expect(await sesionDe(sinSesion)).toEqual({ usuario: null, caducada: false })
  })

  it('el middleware borra la cookie caducada y manda a entrar', async () => {
    state.error = caducada
    state.claims = null

    const res = await middleware(peticion('/dashboard', 'sb-abc-auth-token=viejo; mt_consentimiento=u1:2026-10-14'))

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/auth/login')
    const borradas = res.headers.get('set-cookie') ?? ''
    expect(borradas).toMatch(/sb-abc-auth-token=;/)
    expect(borradas).toMatch(/Max-Age=0/i)
    // Las demás cookies no se tocan.
    expect(borradas).not.toMatch(/mt_consentimiento/)
  })

  it('sin sesión pero sin error (nunca entró), no borra nada', async () => {
    state.error = null
    state.claims = null

    const res = await middleware(peticion('/dashboard', 'otra=1'))

    expect(res.status).toBe(307)
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})
