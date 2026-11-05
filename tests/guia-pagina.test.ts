import { describe, it, expect, vi } from 'vitest'
import { createSupabaseMock } from './helpers/supabase-mock'

const mock = createSupabaseMock({
  responses: {
    'guias_publicas.select': {
      data: [
        {
          pregunta_id: 'p1', orden: 1, enunciado: '¿Dónde dormir?', ayuda: null,
          contenido: 'En la sala de padres', revisada_en: '2026-10-01T00:00:00Z',
          autor_rol: 'volunteer', autor_alias: 'Ana_V', autor_id: 'u2', tema: 'UCI neonatal',
        },
      ],
    },
  },
})

vi.mock('@/lib/supabase/server', () => ({ createClient: async () => mock.client }))

const { generateMetadata } = await import('@/app/guias/[tema]/page')

describe('página de una guía', () => {
  it('pide a los buscadores que no la indexen', async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ tema: 'uci-neonatal' }),
    })

    expect(meta.robots).toMatchObject({ index: false, follow: false })
  })

  it('la canónica es por tema, sin hospital', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ tema: 'uci-neonatal' }) })

    expect(meta.alternates?.canonical).toBe('/guias/uci-neonatal')
  })

  it('pide el alias para enseñar quién escribió', () => {
    const select = mock.calls.find((c) => c.table === 'guias_publicas' && c.op === 'select')
    expect(String(select?.payload)).toMatch(/autor_alias/)
    // Y ya no se filtra por hospital.
    expect(JSON.stringify(mock.calls.filter((c) => c.table === 'guias_publicas'))).not.toMatch(/hospital_slug/)
  })
})
