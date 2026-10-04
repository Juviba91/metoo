import { createClient, getUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ContactButton } from '@/components/contact-button'
import { BlockButton } from '@/components/block-button'
import { isUserBlocked, canInteractWith, contarSolicitudesPendientes } from '@/app/safety/actions'
import { ProfileCard } from '@/components/profile-card'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteFooter } from '@/components/site-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Perfil' }

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const user = await getUser()
  if (!user) redirect('/auth/login')

  if (id === user.id) redirect('/dashboard/perfil')

  const [{ data: viewer }, { data: profile }] = await Promise.all([
    supabase.from('profiles').select('id, role').eq('id', user.id).single(),
    supabase
      .from('profiles')
      .select(
        'id, alias, city, bio, role, is_active, deleted_at, stage, support_modes, profile_hashtags(hashtag_id, hashtags(id, slug, label))',
      )
      .eq('id', id)
      .single(),
  ])

  if (!viewer) redirect('/onboarding')
  if (!profile) notFound()
  if (profile.role === viewer.role) notFound()
  // La ficha de quien se dio de baja se conserva para que su conversación siga
  // teniendo sentido, no para que se le pueda visitar el perfil.
  if (profile.deleted_at) notFound()

  const [connectionResult, { data: unreadData }, pendingCount, isBlocked, canInteract] = await Promise.all([
    viewer.role === 'seeker'
      ? supabase
          .from('connections')
          .select('id, status')
          .eq('seeker_id', user.id)
          .eq('volunteer_id', id)
          .maybeSingle()
      : supabase
          .from('connections')
          .select('id, status')
          .eq('volunteer_id', user.id)
          .eq('seeker_id', id)
          .maybeSingle(),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
    viewer.role === 'volunteer' ? contarSolicitudesPendientes() : Promise.resolve(0),
    isUserBlocked(id),
    canInteractWith(id),
  ])

  // Los listados ya ocultan a quien te ha bloqueado, pero la URL directa
  // seguía sirviendo el perfil entero. Se responde como si no existiera, para
  // no revelar que hay un bloqueo. Si el bloqueo es MÍO el perfil sigue
  // accesible: es desde aquí desde donde se desbloquea.
  if (!canInteract && !isBlocked) notFound()

  const existingConn = connectionResult.data
  const alreadySent = !!existingConn && existingConn.status !== 'rejected'

  const hashtags = (profile.profile_hashtags as any[])
    ?.map((ph: any) => ph.hashtags)
    .filter(Boolean) ?? []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>

        <ProfileCard perfil={{ ...profile, hashtags }}>
          {viewer.role === 'seeker' ? (
            profile.is_active ? (
              <ContactButton
                volunteerId={id}
                alreadySent={alreadySent}
                connectionId={alreadySent ? existingConn?.id : undefined}
              />
            ) : (
              <div className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm text-muted-foreground">
                No disponible en este momento
              </div>
            )
          ) : existingConn && existingConn.status !== 'rejected' ? (
            <Link
              href={`/dashboard/chat/${existingConn.id}`}
              className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Ver conversación →
            </Link>
          ) : (
            <div className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm text-muted-foreground">
              Esperando contacto
            </div>
          )}
          <BlockButton userId={id} isBlocked={isBlocked} />
        </ProfileCard>

      </main>

      <SiteFooter className="hidden sm:block" />
      <FeedbackBubble />
      <BottomNav
        pendingCount={pendingCount}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
