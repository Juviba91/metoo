import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: hashtags } = await supabase
    .from('hashtags')
    .select('id, slug, label')
    .order('label')

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <OnboardingWizard suggestions={hashtags ?? []} />
    </div>
  )
}

