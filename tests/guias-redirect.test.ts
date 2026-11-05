import { describe, it, expect, vi } from 'vitest'

const permanentRedirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`)
})
vi.mock('next/navigation', () => ({ permanentRedirect }))

const { default: GuiaAntigua } = await import('@/app/guias/[tema]/[viejo]/page')
const { default: CartelAntiguo } = await import('@/app/guias/[tema]/[viejo]/cartel/page')

// Antes las guías eran /guias/<hospital>/<tema>, y hay carteles con QR ya
// impresos y repartidos con esa dirección: no pueden acabar en un 404.
describe('URLs antiguas de las guías', () => {
  it('/guias/<hospital>/<tema> lleva a /guias/<tema>', async () => {
    await expect(
      GuiaAntigua({
        params: Promise.resolve({ tema: 'la-paz', viejo: 'uci-neonatal' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('REDIRECT:/guias/uci-neonatal')
  })

  it('conserva el utm del QR, que es como se mide cuánta gente viene del cartel', async () => {
    await expect(
      GuiaAntigua({
        params: Promise.resolve({ tema: 'la-paz', viejo: 'uci-neonatal' }),
        searchParams: Promise.resolve({ utm_source: 'cartel', utm_medium: 'qr' }),
      }),
    ).rejects.toThrow('REDIRECT:/guias/uci-neonatal?utm_source=cartel&utm_medium=qr')
  })

  it('el cartel viejo lleva al cartel nuevo', async () => {
    await expect(
      CartelAntiguo({
        params: Promise.resolve({ tema: 'la-paz', viejo: 'uci-neonatal' }),
        searchParams: Promise.resolve({ formato: 'tarjetas' }),
      }),
    ).rejects.toThrow('REDIRECT:/guias/uci-neonatal/cartel?formato=tarjetas')
  })
})
