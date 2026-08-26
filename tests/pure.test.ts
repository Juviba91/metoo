import { describe, it, expect, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }))
vi.mock('@/app/safety/actions', () => ({
  checkRateLimit: vi.fn(),
  getHiddenUserIds: vi.fn(),
}))

const { toSlug } = await import('@/lib/slug')
const { escapeHtml } = await import('@/supabase/functions/_shared/email')

describe('toSlug', () => {
  it('normaliza acentos y eñes', () => {
    expect(toSlug('Depresión')).toBe('depresion')
    expect(toSlug('Niño')).toBe('nino')
    expect(toSlug('ÁÉÍÓÚ')).toBe('aeiou')
  })

  it('convierte separadores en guiones simples', () => {
    expect(toSlug('UCI Neonatal')).toBe('uci-neonatal')
    expect(toSlug('duelo   por  un hijo')).toBe('duelo-por-un-hijo')
  })

  it('no deja guiones sueltos en los extremos', () => {
    expect(toSlug('  hola  ')).toBe('hola')
    expect(toSlug('!!!hola!!!')).toBe('hola')
  })

  it('devuelve cadena vacía cuando no queda nada utilizable', () => {
    // createPost se apoya en esto para descartar hashtags inservibles
    expect(toSlug('!!!')).toBe('')
    expect(toSlug('')).toBe('')
  })
})

describe('escapeHtml', () => {
  it('neutraliza etiquetas en el contenido del email', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('escapa comillas, que romperían los atributos', () => {
    expect(escapeHtml(`"><img src=x onerror=y>`)).toBe(
      '&quot;&gt;&lt;img src=x onerror=y&gt;',
    )
  })

  it('escapa el ampersand antes que el resto, sin doble escape', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })

  it('deja intacto el texto normal, acentos incluidos', () => {
    expect(escapeHtml('Ánimo, mañana será mejor')).toBe('Ánimo, mañana será mejor')
  })
})
