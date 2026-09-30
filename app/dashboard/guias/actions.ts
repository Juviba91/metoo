'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Añade una aportación a una guía.
 *
 * La validación de verdad está en `aportar_a_guia`: rol de voluntario, que el
 * tema esté en tu perfil, longitud y rate limit. Aquí no se repite —una server
 * action es un endpoint y la base es la única frontera que no se puede
 * saltar—, solo se traduce el error a algo legible.
 */
export async function aportar(
  hospitalSlug: string,
  temaSlug: string,
  preguntaId: string,
  contenido: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.rpc('aportar_a_guia', {
    p_hospital_slug: hospitalSlug,
    p_tema_slug: temaSlug,
    p_pregunta_id: preguntaId,
    p_contenido: contenido,
  })

  if (error) {
    console.error('aportar_a_guia failed:', error)
    // Los mensajes de la función están escritos para leerse; el resto, no.
    return { error: error.message || 'No se pudo guardar' }
  }

  revalidatePath('/dashboard/guias')
  revalidatePath(`/guias/${hospitalSlug}/${temaSlug}`)
  revalidatePath('/guias')
  return { success: true }
}
