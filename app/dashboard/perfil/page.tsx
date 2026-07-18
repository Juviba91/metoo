import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditForm } from './edit-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: allHashtags }] = await Promise.all([
    supabase
      .from('profiles')
      .select('alias, city, bio, role, profile_hashtags(hashtag_id, hashtags(id, slug, label))')
      .eq('id', user.id)
      .single(),
    supabase.from('hashtags').select('id, slug, label').order('label'),
  ])

  if (!profile) redirect('/onboarding')

  const profileHashtags = (profile.profile_hashtags as any[])
    ?.map((ph: any) => ph.hashtags)
    .filter(Boolean) ?? []

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {/* Mobile sub-header with back button */}
      <div className="flex items-center gap-3 border-b border-border/40 px-6 py-3 sm:hidden">
        <Link
          href="/dashboard"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-semibold">Editar perfil</h1>
      </div>

      <main className="mx-auto max-w-lg px-6 py-8">
        <EditForm
          initial={{
            alias: profile.alias,
            city: profile.city,
            bio: profile.bio,
            hashtags: profileHashtags,
          }}
          role={profile.role}
          suggestions={allHashtags ?? []}
        />
      </main>

    </div>
  )
}
