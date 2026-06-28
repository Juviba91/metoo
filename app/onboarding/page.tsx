import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: hashtags } = await supabase
    .from('hashtags')
    .select('id, slug, label')
    .order('label')

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:px-6 sm:py-12">
      <OnboardingWizard suggestions={hashtags ?? []} />
    </div>
  )
}

