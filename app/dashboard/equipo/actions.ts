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

  // También la lista de Chats: enseña el último mensaje, y viene de la caché
  // del router (`staleTimes.dynamic`, 30 s).
  revalidatePath('/dashboard/equipo')
  revalidatePath('/dashboard/chats')
  return { success: true }
}

/**
 * Marca como leído lo que el equipo te ha escrito, y avisa a las pestañas que
 * pintan el globo de «sin leer». Se llama desde el navegador al ver la
 * conversación (como `markConnectionRead` en los chats), no al renderizarla:
 * renderizar no puede revalidar, y un prefetch la marcaría sin que nadie la
 * haya abierto.
 */
export async function marcarEquipoLeido(): Promise<void> {
  const user = await getUser()
  if (!user) return

  const supabase = await createClient()
  const { error } = await supabase.rpc('marcar_equipo_leido')
  if (error) {
    console.error('marcar_equipo_leido failed:', error)
    return
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/chats')
  revalidatePath('/dashboard/perfil')
  revalidatePath('/feed')
}
