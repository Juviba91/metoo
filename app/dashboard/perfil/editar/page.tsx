import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EditForm } from '../edit-form'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteFooter } from '@/components/site-footer'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import type { UserRole } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Editar perfil' }

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: allHashtags }, pendingCount, { data: unreadData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('alias, city, bio, role, is_active, stage, support_modes, profile_hashtags(hashtag_id, hashtags(id, slug, label))')
      .eq('id', user.id)
      .single(),
    supabase.from('hashtags').select('id, slug, label').order('label'),
    contarSolicitudesPendientes(),
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
        <Link
          href="/dashboard/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Perfil
        </Link>

        <h1 className="hidden text-2xl font-bold sm:block">Editar perfil</h1>

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
      </main>

      <SiteFooter className="hidden sm:block" />
      <FeedbackBubble />
      <BottomNav
        pendingCount={profile.role === 'volunteer' ? pendingCount : 0}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
