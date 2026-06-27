import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardMatches } from '@/components/dashboard-matches'
import { MapPin, MessageCircle, LogOut } from 'lucide-react'
import { signOut } from '@/app/auth/actions'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, bio, profile_categories(category_id, categories(slug, name, emoji))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const oppositeRole = profile.role === 'seeker' ? 'volunteer' : 'seeker'

  const [{ data: matches }, { data: connections }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, alias, city, bio, profile_categories(category_id, categories(slug, name, emoji))')
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
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-10">
        {/* Profile card */}
        <div className="rounded-xl border border-border bg-muted/30 p-6">
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
    </div>
  )
}
