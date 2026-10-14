import { describe, it, expect, vi } from 'vitest'
import { createSupabaseMock } from './helpers/supabase-mock'

const mock = createSupabaseMock({
  responses: {
    'guias_publicas.select': {
      data: [
        {
          pregunta_id: 'p1', orden: 1, enunciado: '¿Dónde dormir?', ayuda: null,
          contenido: 'En la sala de padres', revisada_en: '2026-10-01T00:00:00Z',
          autor_rol: 'volunteer', hospital: 'La Paz', ciudad: 'Madrid', tema: 'UCI neonatal',
        },
      ],
    },
  },
})

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mock.client }))

const { generateMetadata } = await import('@/app/guias/[hospital]/[tema]/page')

describe('página de una guía', () => {
  it('pide a los buscadores que no la indexen', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ hospital: 'la-paz', tema: 'uci-neonatal' }),
    })

    expect(meta.robots).toMatchObject({ index: false, follow: false })
  })

  it('no pide a la base ni el alias ni el id de quien escribe', () => {
    const select = mock.calls.find((c) => c.table === 'guias_publicas' && c.op === 'select')
    expect(String(select?.payload)).not.toMatch(/autor_alias|autor_id/)
  })
})
