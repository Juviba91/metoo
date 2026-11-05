import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

/**
 * Las guías en las que esta persona ha escrito, con enlace a cada una.
 *
 * Sale del mismo sitio que lo que se lee en las guías (`guias_publicas`), así
 * que solo cuenta lo visible: lo que se ocultó por moderación no aparece, y si
 * no hay nada no se pinta nada (un bloque vacío en cada perfil sería ruido).
 */
export async function GuiasDePerfil({ userId, propio = false }: { userId: string; propio?: boolean }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('guias_publicas')
    .select('tema_slug, tema')
    .eq('autor_id', userId)
    .limit(500)

  // Una fila por aportación: una guía con varias respuestas sale una vez.
  const guias = [...new Map((data ?? []).map((g) => [g.tema_slug, g.tema])).entries()]
    .map(([slug, tema]) => ({ slug, tema }))
    .sort((a, b) => a.tema.localeCompare(b.tema, 'es'))

  if (guias.length === 0) return null

  return (
    <div className="mt-6 rounded-xl border border-border p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <BookOpen className="size-4" />
        {propio ? 'Tus guías' : 'Guías que ha escrito'}
      </p>
      <ul className="mt-2 space-y-1">
        {guias.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guias/${g.slug}`}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              {g.tema} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
