'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { toSlug, toLabel, hashtagValido, MAX_LONGITUD_HASHTAG } from '@/lib/slug'

/** Lo mismo que el `maxLength` del textarea de la burbuja de feedback. */
const MAX_FEEDBACK = 1000
const MAX_SUGERENCIA = 100

export async function submitFeedback(content: string) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  // El `maxLength` del textarea solo vive en el navegador: la server action es
  // un endpoint y se puede llamar directamente con lo que sea.
  const trimmed = content.trim()
  if (!trimmed || trimmed.length > MAX_FEEDBACK) return { error: 'Mensaje no válido' }

  const { error } = await supabase.from('feedback').insert({
    profile_id: user.id,
    content: trimmed,
  })

  // El mensaje de Postgres no le dice nada a quien escribe y puede filtrar
  // detalles del esquema.
  if (error) {
    console.error('Error al guardar feedback:', error)
    return { error: 'No se pudo enviar. Inténtalo de nuevo.' }
  }
  return { success: true }
}

export async function submitSuggestion(suggestion: string) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const trimmed = suggestion.trim()
  if (!trimmed || trimmed.length > MAX_SUGERENCIA) return { error: 'Sugerencia no válida' }

  const { error } = await supabase.from('hashtag_suggestions').insert({
    profile_id: user.id,
    suggestion: trimmed,
  })

  if (error) {
    console.error('Error al guardar la sugerencia:', error)
    return { error: 'No se pudo enviar. Inténtalo de nuevo.' }
  }
  return { success: true }
}

export async function createHashtag(
  label: string,
): Promise<{ hashtag?: { id: string; slug: string; label: string }; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  // Misma normalización que en el feed: la etiqueta acaba en la misma tabla y
  // en la misma pantalla, venga de un post o del editor de perfil. El slug se
  // calcula con `toSlug`, que hasta ahora estaba copiado aquí a mano.
  const trimmed = toLabel(label).slice(0, MAX_LONGITUD_HASHTAG)
  if (!trimmed) return { error: 'Hashtag vacío' }

  const slug = toSlug(trimmed)
  if (!hashtagValido(slug, trimmed)) return { error: 'Hashtag no válido' }

  // Por RPC, no con un INSERT directo: la tabla ya no acepta escrituras desde
  // fuera. La función comprueba la forma, gasta rate limit solo si la etiqueta
  // es nueva de verdad, y devuelve la fila exista ya o se acabe de crear —el
  // `ON CONFLICT DO NOTHING` no la devolvía y había que releerla a mano.
  const { data, error } = await supabase.rpc('crear_hashtag', {
    p_slug: slug,
    p_label: trimmed,
  })

  const fila = (Array.isArray(data) ? data[0] : data) as
    | { id: string; slug: string; label: string }
    | null
    | undefined

  if (!fila) return { error: error?.message || 'Error al crear hashtag' }

  return { hashtag: fila }
}
