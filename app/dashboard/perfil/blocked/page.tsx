import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Shield } from 'lucide-react'
import { getBlockedUsers } from '@/app/safety/actions'
import { BlockButton } from '@/components/block-button'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Usuarios bloqueados' }

export default async function BlockedUsersPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) redirect('/auth/login')

  const blockedIds = await getBlockedUsers()

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

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard/perfil"
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">🚫 Usuarios bloqueados</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los usuarios que has bloqueado
            </p>
          </div>
        </div>

        {blockedProfiles.length > 0 ? (
          <div className="space-y-3">
            {blockedProfiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
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
          <div className="rounded-lg border border-border p-12 text-center">
            <Shield className="mx-auto mb-4 size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              No tienes usuarios bloqueados
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Los usuarios que bloquees aparecerán aquí
            </p>
          </div>
        )}
      </main>

      <SiteFooter className="hidden sm:block" />
    </div>
  )
}
