import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { destinoSeguro } from '@/lib/destino'

const sesion: { user: { id: string; email?: string; email_confirmed_at?: string | null } | null } = { user: null }
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: sesion.user } }),
      getClaims: async () => ({
        data: sesion.user
          ? {
              claims: {
                sub: sesion.user.id,
                email: sesion.user.email,
                user_metadata: { email_verified: Boolean(sesion.user.email_confirmed_at) },
              },
            }
          : null,
        error: null,
      }),
    },
  }),
}))

const { middleware } = await import('@/middleware')

describe('destinoSeguro', () => {
  it('acepta rutas internas con su query', () => {
    expect(destinoSeguro('/dashboard/guias?tema=prematuros')).toBe('/dashboard/guias?tema=prematuros')
  })

  it.each([
    [null],
    [''],
    ['https://malo.com'],
    ['//malo.com'],
    ['/\\malo.com'],
    ['/auth/login'],
  ])('rechaza %j y vuelve a Inicio', (next) => {
    expect(destinoSeguro(next)).toBe('/dashboard')
  })
})

describe('middleware', () => {
  it('sin sesión, manda al login recordando a dónde ibas', async () => {
    sesion.user = null
    const res = await middleware(new NextRequest('https://www.metoonetwork.xyz/dashboard/guias?tema=prematuros'))

    const destino = new URL(res.headers.get('location')!)
    expect(destino.pathname).toBe('/auth/login')
    expect(destino.searchParams.get('next')).toBe('/dashboard/guias?tema=prematuros')
  })

  it('con sesión, el login devuelve al enlace de origen', async () => {
    sesion.user = { id: 'u1', email_confirmed_at: '2026-01-01' }
    const res = await middleware(
      new NextRequest('https://www.metoonetwork.xyz/auth/login?next=%2Fdashboard%2Fguias%3Ftema%3Dprematuros'),
    )

    const destino = new URL(res.headers.get('location')!)
    expect(destino.pathname).toBe('/dashboard/guias')
    expect(destino.searchParams.get('tema')).toBe('prematuros')
  })

  it('no se deja usar para mandar a otro dominio', async () => {
    sesion.user = { id: 'u1', email_confirmed_at: '2026-01-01' }
    const res = await middleware(new NextRequest('https://www.metoonetwork.xyz/auth/login?next=%2F%2Fmalo.com'))

    const destino = new URL(res.headers.get('location')!)
    expect(destino.host).toBe('www.metoonetwork.xyz')
    expect(destino.pathname).toBe('/dashboard')
  })
})
