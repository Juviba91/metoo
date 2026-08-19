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
  await admin.from('metoo_profiles').update({ is_active: isActive }).eq('id', profileId)
  revalidatePath('/admin')
}

export async function deleteUserAccount(userId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('metoo_profiles').delete().eq('id', userId)
  await admin.auth.admin.deleteUser(userId)
  revalidatePath('/admin')
}

export async function resolveReport(reportId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  await admin.from('metoo_reports').update({ resolved: true }).eq('id', reportId)
  revalidatePath('/admin')
}
