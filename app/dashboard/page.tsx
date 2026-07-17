import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardMatches } from '@/components/dashboard-matches'
import { MapPin, MessageCircle, LogOut } from 'lucide-react'
import { signOut, resendConfirmation } from '@/app/auth/actions'
import { acceptConnection, rejectConnection } from '@/app/dashboard/actions'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, bio, profile_categories(category_id, categories(slug, name, emoji)), profile_hashtags(hashtag_id, hashtags(id, slug, label))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const oppositeRole = profile.role === 'seeker' ? 'volunteer' : 'seeker'

  const [{ data: matches }, { data: connections }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, alias, city, bio, profile_categories(category_id, categories(slug, name, emoji)), profile_hashtags(hashtag_id, hashtags(id, slug, label))')
      .eq('role', oppositeRole)
      .eq('is_active', true)
      .neq('id', user.id)
      .limit(50),

    profile.role === 'seeker'
      ? supabase
          .from('connections')
          .select('id, status, volunteer_id, volunteer:volunteer_id(alias, city)')
          .eq('seeker_id', user.id)
          .order('created_at', { ascending: false })
      : supabase
          .from('connections')
          .select('id, status, seeker_id, seeker:seeker_id(alias, city)')
          .eq('volunteer_id', user.id)
          .order('created_at', { ascending: false }),
  ])

  const sentTo = new Set(
    (connections ?? []).map((c: any) =>
      profile.role === 'seeker' ? c.volunteer_id : c.seeker_id,
    ).filter(Boolean),
  )

  const category = (profile.profile_categories as any[])?.[0]?.categories
  const ownHashtags = (profile.profile_hashtags as any[])
    ?.map((ph: any) => ph.hashtags)
    .filter(Boolean) ?? []

  const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    accepted: 'Activa',
    rejected: 'Cerrada',
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight">metoo.</span>
          <nav className="flex items-center gap-1">
            <Link
              href="/feed"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block"
            >
              Feed
            </Link>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit" className="gap-2">
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-6 pb-24 sm:space-y-10 sm:px-6 sm:py-8 sm:pb-8">
        {/* Email confirmation banner */}
        {!user.email_confirmed_at && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ✉️ Confirma tu correo para no perder el acceso a tu cuenta.
            </p>
            <form action={resendConfirmation}>
              <Button type="submit" size="sm" variant="outline" className="shrink-0 text-xs">
                Reenviar
              </Button>
            </form>
          </div>
        )}

        {/* Profile card */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
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
                {category && (
                  <span>
                    {category.emoji} {category.name}
                  </span>
                )}
              </div>
              {profile.bio && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
              )}
              {ownHashtags.length > 0 && (
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
              )}
            </div>
            <Link
              href="/dashboard/perfil"
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Editar
            </Link>
          </div>
        </div>

        {/* Conversations */}
        {connections && connections.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <MessageCircle className="size-5" />
              Tus conversaciones
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(connections as any[]).map((conn) => {
                const other = profile.role === 'seeker' ? conn.volunteer : conn.seeker
                const isPendingVolunteer = conn.status === 'pending' && profile.role === 'volunteer'

                if (isPendingVolunteer) {
                  return (
                    <div key={conn.id} className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{other?.alias ?? 'Usuario'}</p>
                          {other?.city && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="size-3" /> {other.city}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/dashboard/chat/${conn.id}`}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          Ver mensaje →
                        </Link>
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
          role={profile.role}
          sentTo={sentTo}
        />
      </main>

      <BottomNav />
    </div>
  )
}
