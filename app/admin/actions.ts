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

/**
 * Oculta o vuelve a mostrar una aportación de una guía.
 *
 * Ocultar, no borrar: las guías son públicas, las escribe cualquiera con
 * cuenta y no llevan historial, así que un error de moderación tiene que poder
 * deshacerse. La fila se queda con quién la escribió y con el motivo.
 *
 * Va por el cliente de service role como el resto del panel: nadie más puede
 * escribir en `guia_respuestas` —ni `anon` ni `authenticated` tienen permisos
 * sobre esa tabla— así que esto no abre ninguna puerta nueva.
 */
export async function ocultarAportacionGuia(
  id: string,
  oculta: boolean,
  motivo?: string,
) {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('guia_respuestas')
    .update({
      oculta,
      // Al volver a mostrarla se limpia el motivo: si no, queda una razón
      // colgada de algo que ya no está oculto y engaña al mirarlo dentro de
      // seis meses.
      oculta_motivo: oculta ? (motivo?.trim() || null) : null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error ocultando aportación de guía:', error)
    throw new Error('Error al ocultar la aportación')
  }

  revalidatePath('/admin')
  revalidatePath('/guias')
  // Y la página de la guía, no solo el índice: con `staleTimes.dynamic` a 30 s,
  // quien la tuviera abierta seguiría viendo lo que acabas de ocultar. Con el
  // patrón de la ruta dinámica se invalidan todas sus instancias, que es lo que
  // hace falta porque aquí no sabemos de qué guía era.
  revalidatePath('/guias/[hospital]/[tema]', 'page')
}
