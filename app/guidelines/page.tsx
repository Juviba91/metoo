import { createClient, getUser } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'
import { GuidelinesContent } from './guidelines-content'

export const metadata = { title: 'Normas de la comunidad' }

export default async function GuidelinesPage() {
  const supabase = await createClient()
  const user = await getUser()

  let defaultRole: 'volunteer' | 'seeker' | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    // `role` es text en BD, acotado por el CHECK profiles_role_check
    defaultRole = (profile?.role as UserRole | undefined) ?? null
  }

  return <GuidelinesContent defaultRole={defaultRole} />
}
