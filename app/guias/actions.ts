'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * «¿Te ha servido?» en una guía. Sin cuenta, como la propia guía: no se
 * guarda quién vota (ver `votar_guia_tema`). Repetir el voto lo evita el navegador.
 */
export async function votarGuia(
  temaSlug: string,
  util: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.rpc('votar_guia_tema', {
    p_tema_slug: temaSlug,
    p_util: util,
  })
  if (error) {
    console.error('votar_guia_tema failed:', error)
    return { error: 'No se pudo guardar.' }
  }
  return { success: true }
}
