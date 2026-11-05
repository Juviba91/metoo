'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Añade una aportación a la guía de un tema.
 *
 * La validación de verdad está en `aportar_a_tema`: sesión activa, tema y
 * pregunta que existan, longitud y rate limit. Aquí no se repite —una server
 * action es un endpoint y la base es la única frontera que no se puede
 * saltar—, solo se traduce el error a algo legible.
 */
export async function aportar(
  temaSlug: string,
  preguntaId: string,
  contenido: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  // El alias sale siempre con la aportación (lo pone la vista pública).
  const { error } = await supabase.rpc('aportar_a_tema', {
    p_tema_slug: temaSlug,
    p_pregunta_id: preguntaId,
    p_contenido: contenido,
  })

  if (error) {
    console.error('aportar_a_tema failed:', error)
    // Los mensajes de la función están escritos para leerse; el resto, no.
    return { error: error.message || 'No se pudo guardar' }
  }

  revalidatePath('/dashboard/guias')
  revalidatePath(`/guias/${temaSlug}`)
  revalidatePath('/guias')
  return { success: true }
}
