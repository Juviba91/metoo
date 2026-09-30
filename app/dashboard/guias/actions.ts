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
  mostrarAlias: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.rpc('aportar_a_guia', {
    p_hospital_slug: hospitalSlug,
    p_tema_slug: temaSlug,
    p_pregunta_id: preguntaId,
    p_contenido: contenido,
    p_mostrar_alias: mostrarAlias,
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

/**
 * Quita el alias de TODO lo que esta persona haya escrito en las guías.
 *
 * Existe porque la firma es opcional y se marca con una casilla, y una casilla
 * marcada sin pensar no puede ser definitiva cuando el resultado lo indexa
 * Google. Devuelve cuántas aportaciones ha dejado sin firma.
 */
export async function quitarMiFirma(): Promise<{ quitadas?: number; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const { data, error } = await supabase.rpc('quitar_mi_firma_en_guias')

  if (error) {
    console.error('quitar_mi_firma_en_guias failed:', error)
    return { error: 'No se pudo quitar la firma' }
  }

  revalidatePath('/dashboard/guias')
  revalidatePath('/guias')
  return { quitadas: (data as number) ?? 0 }
}
