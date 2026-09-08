'use server'

import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = 'baygual91@gmail.com'

async function requireAdmin() {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')
  return user
}

export async function toggleProfileActive(profileId: string, isActive: boolean) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ is_active: isActive }).eq('id', profileId)
  if (error) {
    console.error('Error toggling profile active:', error)
    throw new Error('Error al cambiar estado del perfil')
  }
  revalidatePath('/admin')
}

export async function deleteUserAccount(userId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error: profileError } = await admin.from('profiles').delete().eq('id', userId)
  if (profileError) {
    console.error('Error deleting profile:', profileError)
    throw new Error('Error al eliminar el perfil')
  }
  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) {
    console.error('Error deleting auth user:', authError)
    throw new Error('Error al eliminar la cuenta de auth')
  }
  revalidatePath('/admin')
}

/**
 * Borra un mensaje de la burbuja de feedback o una sugerencia de hashtag.
 *
 * `tabla` no se interpola en ningún sitio: se comprueba contra una lista
 * cerrada y se usa el literal, no lo que llegue. Es una server action, o sea un
 * endpoint, y el nombre de tabla viene del cliente.
 */
export async function eliminarComentario(
  tabla: 'feedback' | 'hashtag_suggestions',
  id: string,
) {
  await requireAdmin()

  if (tabla !== 'feedback' && tabla !== 'hashtag_suggestions') {
    throw new Error('Tabla no permitida')
  }

  const admin = createAdminClient()
  const { error } = await admin.from(tabla).delete().eq('id', id)

  if (error) {
    console.error('Error al borrar el comentario:', error)
    throw new Error('No se pudo borrar')
  }

  revalidatePath('/admin')
}

export async function resolveReport(reportId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('reports').update({ resolved: true }).eq('id', reportId)
  if (error) {
    console.error('Error resolving report:', error)
    throw new Error('Error al resolver el reporte')
  }
  revalidatePath('/admin')
}
