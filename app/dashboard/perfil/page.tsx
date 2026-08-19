import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditForm } from './edit-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackForm } from '@/components/feedback-form'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { SiteFooter } from '@/components/site-footer'

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: allHashtags }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('alias, city, bio, role, is_active, profile_hashtags(hashtag_id, hashtags(id, slug, label))')
      .eq('id', user.id)
      .single(),
    supabase.from('hashtags').select('id, slug, label').order('label'),
    supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .eq('volunteer_id', user.id)
      .eq('status', 'pending'),
  ])

  if (!profile) redirect('/onboarding')

  const profileHashtags = (profile.profile_hashtags as any[])
    ?.map((ph: any) => ph.hashtags)
    .filter(Boolean) ?? []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      {/* Mobile sub-header with back button */}
      <div className="flex items-center gap-3 border-b border-border/40 px-6 py-3 sm:hidden">
        <Link
          href="/dashboard"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex flex-1 items-center gap-2">
          <h1 className="font-semibold">Editar perfil</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            profile.role === 'volunteer'
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
          }`}>
            {profile.role === 'volunteer' ? '💛 Voluntario' : '🤝 Busca apoyo'}
          </span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-8 pb-28 sm:pb-8">
        <EditForm
          initial={{
            alias: profile.alias,
            city: profile.city,
            bio: profile.bio,
            hashtags: profileHashtags,
            isActive: profile.is_active ?? true,
          }}
          role={profile.role}
          suggestions={allHashtags ?? []}
        />

        <div className="mt-12 border-t border-border/60 pt-8">
          <h2 className="mb-3 text-sm font-semibold">Feedback</h2>
          <FeedbackForm />
        </div>

        <div className="mt-8 border-t border-border/60 pt-8">
          <h2 className="mb-1 text-sm font-semibold text-destructive">Eliminar cuenta</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Para eliminar permanentemente tu cuenta y todos tus datos escríbenos a{' '}
            <a
              href="mailto:juan@bay-apps.com?subject=Quiero eliminar mi cuenta de metoo"
              className="underline hover:text-foreground"
            >
              juan@bay-apps.com
            </a>
            . Procesamos la solicitud en un máximo de 30 días.
          </p>
        </div>

        <FooterDisclaimer />
      </main>

      <SiteFooter className="hidden sm:block" />
      <BottomNav pendingCount={profile.role === 'volunteer' ? (pendingCount ?? 0) : 0} />
    </div>
  )
}
