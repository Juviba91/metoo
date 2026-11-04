'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { validarMensajeEquipo } from '@/lib/equipo'

/**
 * La persona escribe al equipo. Va con su propia sesión (no con la clave de
 * servicio): es la política de la base la que deja escribir solo en lo suyo y
 * solo como persona, nunca como equipo. El aviso a Juan lo manda un disparador.
 */
export async function enviarAlEquipo(contenido: string): Promise<{ success?: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const mensaje = validarMensajeEquipo(contenido)
  if (!mensaje.ok) return { error: mensaje.error }

  const supabase = await createClient()
  const { error } = await supabase
    .from('mensajes_equipo')
    .insert({ usuario_id: user.id, del_equipo: false, contenido: mensaje.valor })

  if (error) {
    console.error('enviarAlEquipo failed:', error)
    return { error: 'No se pudo enviar. Inténtalo de nuevo en un rato.' }
  }

  revalidatePath('/dashboard/equipo')
  return { success: true }
}
