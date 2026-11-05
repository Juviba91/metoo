import { describe, it, expect, vi } from 'vitest'
import { createSupabaseMock } from './helpers/supabase-mock'

const state = { mock: createSupabaseMock() }
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => state.mock.client }))

const { GuiasDePerfil } = await import('@/components/guias-de-perfil')

// Los elementos de React llevan referencias circulares: se recorre el árbol y
// se juntan los textos y los enlaces.
function volcar(nodo: unknown): string {
  if (nodo == null || typeof nodo === 'boolean') return ''
  if (typeof nodo === 'string' || typeof nodo === 'number') return String(nodo)
  if (Array.isArray(nodo)) return nodo.map(volcar).join(' ')
  const el = nodo as { props?: { href?: string; children?: unknown } }
  return `${el.props?.href ?? ''} ${volcar(el.props?.children)}`
}

const con = (rows: { tema_slug: string; tema: string }[]) => {
  state.mock = createSupabaseMock({ responses: { 'guias_publicas.select': { data: rows } } })
}

describe('GuiasDePerfil', () => {
  it('enlaza a cada guía en la que ha escrido, una vez aunque haya varias respuestas', async () => {
    con([
      { tema_slug: 'prematuros', tema: 'Prematuros' },
      { tema_slug: 'prematuros', tema: 'Prematuros' },
      { tema_slug: 'duelo', tema: 'Duelo' },
    ])

    const html = volcar(await GuiasDePerfil({ userId: 'u1' }))

    expect(html).toContain('/guias/prematuros')
    expect(html).toContain('/guias/duelo')
    expect(html.match(/\/guias\/prematuros/g)).toHaveLength(1)
    expect(html).toContain('Guías que ha escrito')
  })

  it('en tu propio perfil se titula «Tus guías»', async () => {
    con([{ tema_slug: 'duelo', tema: 'Duelo' }])

    expect(volcar(await GuiasDePerfil({ userId: 'u1', propio: true }))).toContain('Tus guías')
  })

  it('si no ha escrito nada, no pinta nada', async () => {
    con([])

    expect(await GuiasDePerfil({ userId: 'u1' })).toBeNull()
  })

  it('lee de la vista pública, que ya deja fuera lo oculto', async () => {
    con([{ tema_slug: 'duelo', tema: 'Duelo' }])
    await GuiasDePerfil({ userId: 'u-9' })

    // Nunca de `guia_respuestas`: ahí hay también lo que se ocultó por moderación.
    expect(state.mock.calls.some((c) => c.table === 'guia_respuestas')).toBe(false)
    expect(String(state.mock.payloadOf('guias_publicas', 'select'))).toContain('tema')
  })
})
