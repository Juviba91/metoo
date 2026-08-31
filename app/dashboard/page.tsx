import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardMatches } from '@/components/dashboard-matches'
import { MapPin, MessageCircle } from 'lucide-react'
import { resendConfirmation } from '@/app/auth/actions'
import { acceptConnection, rejectConnection, toggleAvailability } from '@/app/dashboard/actions'
import { getHiddenUserIds } from '@/app/safety/actions'
import type { UserRole } from '@/types/database'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inicio' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) redirect('/auth/login')

  // El perfil y los bloqueos no dependen entre sí: encadenarlos añadía una
  // ida y vuelta a Supabase antes de poder empezar siquiera las demás.
  const [{ data: profile }, hiddenIds] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, bio, profile_hashtags(hashtag_id, hashtags(id, slug, label))')
      .eq('id', user.id)
      .single(),
    getHiddenUserIds(),
  ])

  if (!profile) redirect('/onboarding')

  const oppositeRole = profile.role === 'seeker' ? 'volunteer' : 'seeker'

  let matchesQuery = supabase
    .from('profiles')
    .select('id, alias, city, bio, stage, support_modes, profile_hashtags(hashtag_id, hashtags(id, slug, label))')
    .eq('role', oppositeRole)
    .eq('is_active', true)
    .neq('id', user.id)

  if (hiddenIds.length > 0) {
    matchesQuery = matchesQuery.not('id', 'in', `(${hiddenIds.join(',')})`)
  }

  const [{ data: matches }, { data: connections }, { data: unreadData }, { data: allHashtags }] = await Promise.all([
    matchesQuery.limit(50),

    profile.role === 'seeker'
      ? supabase
          .from('connections')
          .select('id, status, volunteer_id, volunteer:volunteer_id(alias, city)')
          .eq('seeker_id', user.id)
          .order('created_at', { ascending: false })
      : supabase
          .from('connections')
          .select('id, status, seeker_id, seeker:seeker_id(alias, city, bio, profile_hashtags(hashtag_id, hashtags(id, slug, label)))')
          .eq('volunteer_id', user.id)
          .order('created_at', { ascending: false }),

    supabase.rpc('get_unread_count', { user_uuid: user.id }),

    supabase.from('hashtags').select('id, slug, label').order('label'),
  ])

  // Las conversaciones con usuarios bloqueados también se ocultan
  const hiddenSet = new Set(hiddenIds)
  const visibleConnections = (connections ?? []).filter((c: any) => {
    const otherId = profile.role === 'seeker' ? c.volunteer_id : c.seeker_id
    return !otherId || !hiddenSet.has(otherId)
  })

  // Map otherUserId -> connectionId for non-rejected connections
  const connectedTo = Object.fromEntries(
    visibleConnections
      .filter((c: any) => c.status !== 'rejected')
      .map((c: any) => {
        const otherId = profile.role === 'seeker' ? c.volunteer_id : c.seeker_id
        return [otherId, c.id] as const
      })
      .filter(([otherId]) => Boolean(otherId)),
  ) as Record<string, string>

  const pendingCount =
    profile.role === 'volunteer'
      ? visibleConnections.filter((c: any) => c.status === 'pending').length
      : 0
  const chatUnread = (unreadData as number) ?? 0

  const ownHashtags = (profile.profile_hashtags as any[])
    ?.map((ph: any) => ph.hashtags)
    .filter(Boolean) ?? []

  const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    accepted: 'Activa',
    rejected: 'Cerrada',
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-6 pb-24 sm:space-y-10 sm:px-6 sm:py-8 sm:pb-8">
        {/* Email confirmation banner */}
        {!user.email_confirmed_at && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ✉️ Confirma tu correo para no perder el acceso a tu cuenta.
            </p>
            <form
              action={async () => {
                'use server'
                await resendConfirmation()
              }}
            >
              <Button type="submit" size="sm" variant="outline" className="shrink-0 text-xs">
                Reenviar
              </Button>
            </form>
          </div>
        )}

        {/* Profile card */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-sm text-muted-foreground">
                {profile.role === 'seeker' ? '🤝 Buscando apoyo' : '💛 Ofreciendo ayuda'}
              </p>
              <h1 className="text-2xl font-bold">{profile.alias}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {profile.city}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
              )}
              {ownHashtags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ownHashtags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      #{tag.label}
                    </span>
                  ))}
                </div>
              ) : (
                <Link
                  href="/dashboard/perfil"
                  className="mt-3 inline-block text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  + Añade hashtags a tu perfil para aparecer en búsquedas
                </Link>
              )}
            </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/dashboard/perfil"
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Editar
                </Link>
              </div>
            </div>
            {profile.role === 'volunteer' && (
              <form action={toggleAvailability.bind(null, !profile.is_active)} className="self-start">
                <button
                  type="submit"
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    profile.is_active
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400'
                      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {profile.is_active ? '● Disponible para ayudar' : '○ No disponible'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Conversations */}
        {visibleConnections.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <MessageCircle className="size-5" />
              Tus conversaciones
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(visibleConnections as any[]).map((conn) => {
                const other = profile.role === 'seeker' ? conn.volunteer : conn.seeker
                const isPendingVolunteer = conn.status === 'pending' && profile.role === 'volunteer'

                if (isPendingVolunteer) {
                  const seekerTags = ((other as any)?.profile_hashtags ?? [])
                    .map((ph: any) => ph.hashtags)
                    .filter(Boolean)
                    .slice(0, 4)
                  return (
                    <div key={conn.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <div className="mb-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{other?.alias ?? 'Usuario'}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {other?.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" /> {other.city}
                                </span>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/chat/${conn.id}`}
                            className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Ver mensaje →
                          </Link>
                        </div>
                        {(other as any)?.bio && (
                          <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {(other as any).bio}
                          </p>
                        )}
                        {seekerTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {seekerTags.map((tag: any) => (
                              <span
                                key={tag.id}
                                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                #{tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <form action={acceptConnection.bind(null, conn.id)} className="flex-1">
                          <Button type="submit" size="sm" className="w-full">
                            Aceptar
                          </Button>
                        </form>
                        <form action={rejectConnection.bind(null, conn.id)} className="flex-1">
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="w-full text-destructive hover:text-destructive"
                          >
                            Rechazar
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={conn.id}
                    href={`/dashboard/chat/${conn.id}`}
                    className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <p className="font-semibold">{other?.alias ?? 'Usuario'}</p>
                      {other?.city && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {other.city}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        conn.status === 'accepted'
                          ? 'text-green-600'
                          : conn.status === 'rejected'
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {statusLabel[conn.status] ?? conn.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Matches with search */}
        <DashboardMatches
          matches={(matches ?? []) as any}
          role={profile.role as UserRole}
          connectedTo={connectedTo}
          allHashtags={(allHashtags ?? []) as any}
        />

      </main>

      <SiteFooter className="hidden sm:block" />
      <FeedbackBubble />
      <BottomNav pendingCount={pendingCount} chatUnread={chatUnread} />
    </div>
  )
}
