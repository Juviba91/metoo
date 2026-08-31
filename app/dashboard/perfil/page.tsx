import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditForm } from './edit-form'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteFooter } from '@/components/site-footer'
import { AccountSection } from './account-section'
import { AppAbout } from '@/components/app-about'
import { HowItWorks } from '@/components/how-it-works'
import type { UserRole } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Perfil' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: allHashtags }, { count: pendingCount }, { data: unreadData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('alias, city, bio, role, is_active, email_notifications_enabled, stage, support_modes, profile_hashtags(hashtag_id, hashtags(id, slug, label))')
      .eq('id', user.id)
      .single(),
    supabase.from('hashtags').select('id, slug, label').order('label'),
    supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .eq('volunteer_id', user.id)
      .eq('status', 'pending'),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
  ])

  if (!profile) redirect('/onboarding')

  const profileHashtags = (profile.profile_hashtags as any[])
    ?.map((ph: any) => ph.hashtags)
    .filter(Boolean) ?? []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-8 px-6 py-8 pb-28 sm:pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="hidden text-2xl font-bold sm:block">Mi perfil</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              profile.role === 'volunteer'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
            }`}
          >
            {profile.role === 'volunteer' ? '💛 Voluntario' : '🤝 Busco apoyo'}
          </span>
        </div>

        <EditForm
          initial={{
            alias: profile.alias,
            city: profile.city,
            bio: profile.bio,
            hashtags: profileHashtags,
            isActive: profile.is_active ?? true,
            stage: profile.stage ?? null,
            supportModes: profile.support_modes ?? [],
          }}
          role={profile.role as UserRole}
          suggestions={allHashtags ?? []}
        />

        <div className="mt-12 border-t border-border/60 pt-8">
          <HowItWorks />
        </div>

        <div className="mt-12 border-t border-border/60 pt-8">
          <h2 className="mb-4 text-sm font-semibold">Cuenta</h2>
          <AccountSection email={user.email} emailConfirmed={!!user.email_confirmed_at} emailNotificationsEnabled={profile.email_notifications_enabled} />
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

        <div className="mt-12">
          <AppAbout />
        </div>

      </main>

      <SiteFooter className="hidden sm:block" />
      <FeedbackBubble />
      <BottomNav
        pendingCount={profile.role === 'volunteer' ? (pendingCount ?? 0) : 0}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
