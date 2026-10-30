import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './wizard'
import type { Metadata } from 'next'
import { rolDeParam } from '@/lib/alta'

export const metadata: Metadata = { title: 'Completa tu perfil' }

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string }>
}) {
  const supabase = await createClient()

  const user = await getUser()
  if (!user) redirect('/auth/login')

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  if (existingProfile) redirect('/dashboard')

  const { data: hashtags } = await supabase
    .from('hashtags')
    .select('id, slug, label')
    .order('label')

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center sm:px-6 sm:py-12">
      {/* El papel que eligió en la portada viene ya marcado; puede cambiarlo. */}
      <OnboardingWizard suggestions={hashtags ?? []} rolInicial={rolDeParam((await searchParams).rol)} />
    </div>
  )
}

