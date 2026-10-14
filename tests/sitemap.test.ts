import { describe, it, expect } from 'vitest'

const { default: sitemap } = await import('@/app/sitemap')
const { default: robots } = await import('@/app/robots')

describe('sitemap', () => {
  it('incluye el índice de guías pero no cada guía, en el dominio con www', async () => {
    const urls = (await sitemap()).map((e) => e.url)

    // Medida U-3 de la nota legal: las guías de cada hospital no se indexan.
    expect(urls.some((u) => /\/guias\/[^/]+\/[^/]+$/.test(u))).toBe(false)
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
