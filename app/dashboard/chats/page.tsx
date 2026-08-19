import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Activa',
  rejected: 'Cerrada',
}

export default async function ChatsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const connectionsQuery =
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
          .order('created_at', { ascending: false })

  const [{ data: connections }, { data: unreadData }] = await Promise.all([
    connectionsQuery,
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
  ])

  const pendingCount =
    profile.role === 'volunteer'
      ? (connections ?? []).filter((c: any) => c.status === 'pending').length
      : 0

  // Fetch latest message per connection — one parallel query per connection guarantees correctness
  const connectionIds = (connections ?? []).map((c: any) => c.id)
  let lastMessages: Record<string, { content: string; sender_id: string }> = {}

  if (connectionIds.length > 0) {
    const results = await Promise.all(
      connectionIds.map((id: string) =>
        supabase
          .from('messages')
          .select('connection_id, content, sender_id')
          .eq('connection_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ),
    )
    for (const { data } of results) {
      if (data) lastMessages[data.connection_id] = { content: data.content, sender_id: data.sender_id }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        {!connections || connections.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
            <p className="mb-2 text-3xl">💬</p>
            <p>Todavía no tienes conversaciones.</p>
            <p className="mt-1 text-sm">
              {profile.role === 'seeker'
                ? 'Contacta a un voluntario desde Inicio.'
                : 'Las personas que te contacten aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(connections as any[]).map((conn) => {
              const other = profile.role === 'seeker' ? conn.volunteer : conn.seeker
              const last = lastMessages[conn.id]
              const lastIsMe = last?.sender_id === user.id
              return (
                <Link
                  key={conn.id}
                  href={`/dashboard/chat/${conn.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{other?.alias ?? 'Usuario'}</p>
                      <span
                        className={`shrink-0 text-xs font-medium ${
                          conn.status === 'accepted'
                            ? 'text-green-600'
                            : conn.status === 'rejected'
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {statusLabel[conn.status] ?? conn.status}
                      </span>
                    </div>
                    {last ? (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {lastIsMe ? 'Tú: ' : ''}{last.content}
                      </p>
                    ) : other?.city ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {other.city}
                      </p>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </main>

      <SiteFooter className="hidden sm:block" />
      <BottomNav pendingCount={pendingCount} chatUnread={(unreadData as number) ?? 0} />
    </div>
  )
}
