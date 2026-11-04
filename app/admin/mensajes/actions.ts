'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validarMensajeEquipo } from '@/lib/equipo'

const ADMIN_EMAIL = 'baygual91@gmail.com'

async function requireAdmin() {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')
  return user
}

/**
 * Escribe como equipo a una persona, la haya escrito antes o no. Va con la clave
 * de servicio: la base no deja a nadie más escribir como equipo. El aviso por
 * correo a la persona (sin lo escrito) lo manda un disparador.
 */
export async function responderComoEquipo(
  usuarioId: string,
  contenido: string,
): Promise<{ success?: boolean; error?: string }> {
  await requireAdmin()

  const mensaje = validarMensajeEquipo(contenido)
  if (!mensaje.ok) return { error: mensaje.error }

  const admin = createAdminClient()

  const { data: perfil } = await admin
    .from('profiles')
    .select('id, deleted_at')
    .eq('id', usuarioId)
    .maybeSingle()
  if (!perfil || perfil.deleted_at) return { error: 'Esta persona ya no está en metoo.' }

  const { error } = await admin
    .from('mensajes_equipo')
    .insert({ usuario_id: usuarioId, del_equipo: true, contenido: mensaje.valor })

  if (error) {
    console.error('responderComoEquipo failed:', error)
    return { error: 'No se pudo enviar.' }
  }

  revalidatePath('/admin/mensajes')
  revalidatePath(`/admin/mensajes/${usuarioId}`)
  return { success: true }
}
