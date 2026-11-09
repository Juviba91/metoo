import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditForm } from '../edit-form'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { SiteFooter } from '@/components/site-footer'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import type { UserRole } from '@/types/database'
import type { Metadata } from 'next'
import { Pagina, CabeceraPagina, Volver } from '@/components/pagina'

export const metadata: Metadata = { title: 'Editar perfil' }

export default async function EditarPerfilPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: allHashtags }, pendingCount, { data: unreadData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('alias, city, bio, role, is_active, stage, support_modes, profile_hashtags(hashtag_id, role, hashtags(id, slug, label))')
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

  // De qué lado está en cada tema (id del tema -> papel).
  const rolesDeTemas = Object.fromEntries(
    ((profile.profile_hashtags ?? []) as { hashtag_id: string; role: 'seeker' | 'volunteer' }[]).map(
      (ph) => [ph.hashtag_id, ph.role],
    ),
  )

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <Pagina ancho="estrecho">
        <Volver href="/dashboard/perfil">Perfil</Volver>

        <CabeceraPagina titulo="Editar perfil" />

        <EditForm
          initial={{
            alias: profile.alias,
            city: profile.city,
            bio: profile.bio,
            hashtags: profileHashtags,
            roles: rolesDeTemas,
            isActive: profile.is_active ?? true,
            stage: profile.stage ?? null,
            supportModes: profile.support_modes ?? [],
          }}
          role={profile.role as UserRole}
          suggestions={allHashtags ?? []}
        />
      </Pagina>

      <SiteFooter className="hidden sm:block" />
      <BottomNav
        pendingCount={pendingCount}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
