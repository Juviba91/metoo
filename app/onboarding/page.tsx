import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: existingProfile } = await supabase
    .from('metoo_profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  if (existingProfile) redirect('/dashboard')

  const { data: hashtags } = await supabase
    .from('metoo_hashtags')
    .select('id, slug, label')
    .order('label')

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:px-6 sm:py-12">
      <OnboardingWizard suggestions={hashtags ?? []} />
    </div>
  )
}

