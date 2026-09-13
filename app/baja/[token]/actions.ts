'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Da de baja de los avisos de "hay gente esperando".
 *
 * Va con el cliente normal, no con la service role: la baja la hace
 * `baja_resumen()`, que solo sabe apagar esa casilla del perfil que tenga ese
 * token. Esta es la única página sin sesión de la app, y no debería tener a
 * mano una clave capaz de tocar el resto del esquema.
 *
 * El token es un uuid por usuario y no viaja nunca al navegador de nadie más:
 * la columna está revocada para `anon` y `authenticated`.
 */
export async function darDeBaja(token: string): Promise<{ ok: boolean }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('baja_resumen', { p_token: token })

  if (error) {
    console.error('Error al dar de baja del resumen:', error)
    return { ok: false }
  }

  revalidatePath('/dashboard/perfil')
  return { ok: data === true }
}
