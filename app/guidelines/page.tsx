import { createClient } from '@/lib/supabase/server'
import { GuidelinesContent } from './guidelines-content'

export const metadata = { title: 'Normas de la comunidad — metoo' }

export default async function GuidelinesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let defaultRole: 'volunteer' | 'seeker' | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('metoo_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    defaultRole = profile?.role ?? null
  }

  return <GuidelinesContent defaultRole={defaultRole} />
}
