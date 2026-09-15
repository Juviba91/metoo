import { describe, it, expect } from 'vitest'
import { fusionarPosts } from '@/lib/feed'

const p = (id: string, created_at: string) => ({ id, created_at })


// Primera página tal y como la manda el servidor: de más nueva a más vieja.
const PAGINA_1 = [p('a', '2026-09-10'), p('b', '2026-09-09')]
// Lo que se ve tras darle a «Ver más».
const EN_PANTALLA = [...PAGINA_1, p('c', '2026-09-08'), p('d', '2026-09-07')]

describe('fusionarPosts', () => {
  it('conserva las páginas ya cargadas cuando el servidor revalida', () => {
    // El bug: `toggleReaction` hace revalidatePath('/feed'), llega un `posts`
    // nuevo y el resincronizado lo metía tal cual. Dar a un corazón te
    // devolvía a la primera página.
    expect(fusionarPosts(PAGINA_1, EN_PANTALLA).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('pone arriba lo que el servidor trae nuevo, sin duplicar', () => {
    const conPostNuevo = [p('z', '2026-09-11'), ...PAGINA_1]
    expect(fusionarPosts(conPostNuevo, EN_PANTALLA).map((x) => x.id)).toEqual([
      'z', 'a', 'b', 'c', 'd',
    ])
  })

  it('un feed vacío se queda vacío', () => {
    // Filtrar por una etiqueta sin resultados no puede dejar a la vista los
    // posts de la etiqueta anterior.
    expect(fusionarPosts([], EN_PANTALLA)).toEqual([])
  })
})
