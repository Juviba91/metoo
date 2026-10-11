import { describe, it, expect, vi } from 'vitest'
import { createSupabaseMock } from './helpers/supabase-mock'

const mock = createSupabaseMock({
  responses: {
    'guias_indice.select': {
      data: [{ hospital_slug: 'la-paz', tema_slug: 'uci-neonatal', ultima: '2026-10-01T00:00:00Z' }],
    },
  },
})

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mock.client }))

const { default: sitemap } = await import('@/app/sitemap')
const { default: robots } = await import('@/app/robots')

describe('sitemap', () => {
  it('incluye cada guía con algo escrito, en el dominio con www', async () => {
    const urls = (await sitemap()).map((e) => e.url)

    expect(urls).toContain('https://www.metoonetwork.xyz/guias/la-paz/uci-neonatal')
    expect(urls).toContain('https://www.metoonetwork.xyz/guias')
    // El dominio sin www redirige: una URL así en el sitemap la penaliza Google.
    expect(urls.every((u) => u.startsWith('https://www.metoonetwork.xyz/'))).toBe(true)
  })

  it('no lista nada que pida sesión', async () => {
    const urls = (await sitemap()).map((e) => e.url)

    expect(urls.some((u) => /\/(dashboard|admin|auth|onboarding|feed|temas)/.test(u))).toBe(false)
  })
})

describe('robots', () => {
  it('apunta al sitemap y deja fuera lo privado', () => {
    const r = robots()
    const reglas = Array.isArray(r.rules) ? r.rules[0] : r.rules

    expect(r.sitemap).toBe('https://www.metoonetwork.xyz/sitemap.xml')
    expect(reglas.disallow).toEqual(expect.arrayContaining(['/dashboard', '/admin', '/auth']))
  })
})
