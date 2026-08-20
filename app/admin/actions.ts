'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = 'baygual91@gmail.com'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
