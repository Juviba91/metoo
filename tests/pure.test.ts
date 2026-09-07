import { describe, it, expect, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }))
vi.mock('@/app/safety/actions', () => ({
  checkRateLimit: vi.fn(),
  getHiddenUserIds: vi.fn(),
}))

const { toSlug, toLabel } = await import('@/lib/slug')
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

describe('toLabel', () => {
  it('convierte en espacio el guion bajo de los posts', () => {
    // En un post el espacio corta el hashtag, asi que quien quiere dos
    // palabras escribe `#Gemelos_prematuros`. Eso es como se teclea, no como
    // se lee.
    expect(toLabel('Gemelos_prematuros')).toBe('Gemelos prematuros')
    expect(toLabel('siete_mesinos')).toBe('siete mesinos')
  })

  it('respeta el guion normal, que en castellano sí existe', () => {
    expect(toLabel('post-parto')).toBe('post-parto')
  })

  it('no toca las etiquetas que ya vienen bien del perfil', () => {
    expect(toLabel('UCI Neonatal')).toBe('UCI Neonatal')
    expect(toLabel('Duelo por un hijo')).toBe('Duelo por un hijo')
  })

  it('deja un solo espacio y sin sobras en los extremos', () => {
    expect(toLabel('  dos__palabras  ')).toBe('dos palabras')
  })

  it('las dos formas de escribirlo acaban siendo la misma etiqueta', () => {
    // Lo importante: el slug ya coincidía, así que no se parte en dos
    expect(toSlug(toLabel('Gemelos_prematuros'))).toBe(toSlug(toLabel('Gemelos prematuros')))
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
