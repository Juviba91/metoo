import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield } from 'lucide-react'
import { getBlockedUsers, contarSolicitudesPendientes } from '@/app/safety/actions'
import { BottomNav } from '@/components/bottom-nav'
import { BlockButton } from '@/components/block-button'
import { Pagina, CabeceraPagina, Volver } from '@/components/pagina'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Usuarios bloqueados' }

export default async function BlockedUsersPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) redirect('/auth/login')

  const [blockedIds, pendingCount, { data: unreadData }] = await Promise.all([
    getBlockedUsers(),
    contarSolicitudesPendientes(),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
  ])

  let blockedProfiles: any[] = []
  if (blockedIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, alias, city, bio')
      .in('id', blockedIds)

    blockedProfiles = data ?? []
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <Pagina ancho="estrecho">
        <Volver href="/dashboard/perfil">Perfil</Volver>

        <CabeceraPagina titulo="Usuarios bloqueados">Gestiona los usuarios que has bloqueado.</CabeceraPagina>

        {blockedProfiles.length > 0 ? (
          <div className="space-y-3">
            {blockedProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{profile.alias}</p>
                  {profile.city && (
                    <p className="text-sm text-muted-foreground">{profile.city}</p>
                  )}
                  {profile.bio && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {profile.bio}
                    </p>
                  )}
                </div>
                <BlockButton userId={profile.id} isBlocked={true} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border p-12 text-center">
            <Shield className="mx-auto mb-4 size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              No tienes usuarios bloqueados
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Los usuarios que bloquees aparecerán aquí
            </p>
          </div>
        )}
      </Pagina>

      <SiteFooter className="hidden sm:block" />
      <BottomNav pendingCount={pendingCount} chatUnread={(unreadData as number) ?? 0} />
    </div>
  )
}
