import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getHiddenUserIds } from '@/app/safety/actions'
import { MapPin, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chats' }

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Activa',
  rejected: 'Cerrada',
}

export default async function ChatsPage() {
  const supabase = await createClient()
  const user = await getUser()
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

  const [{ data: allConnections }, { data: unreadData }, hiddenIds] = await Promise.all([
    connectionsQuery,
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
    getHiddenUserIds(),
  ])

  // Las conversaciones con usuarios bloqueados no se listan
  const hiddenSet = new Set(hiddenIds)
  const connections = (allConnections ?? []).filter((c: any) => {
    const otherId = profile.role === 'seeker' ? c.volunteer_id : c.seeker_id
    return !otherId || !hiddenSet.has(otherId)
  })

  const pendingCount =
    profile.role === 'volunteer'
      ? connections.filter((c: any) => c.status === 'pending').length
      : 0

  // Último mensaje de cada conversación. Antes se lanzaba una consulta por
  // conversación (N+1): con la lista abierta eso son N idas y vueltas, y esta
  // pantalla es una de las cuatro pestañas. Ahora va en una sola: se piden los
  // mensajes de todas las conexiones ordenados por fecha y se queda el primero
  // de cada una, que por el orden es el más reciente.
  const connectionIds = connections.map((c: any) => c.id)
  const lastMessages: Record<string, { content: string; sender_id: string }> = {}

  if (connectionIds.length > 0) {
    const { data: recent } = await supabase
      .from('messages')
      .select('connection_id, content, sender_id')
      .in('connection_id', connectionIds)
      .order('created_at', { ascending: false })
      .limit(500)

    for (const m of recent ?? []) {
      if (!lastMessages[m.connection_id]) {
        lastMessages[m.connection_id] = { content: m.content, sender_id: m.sender_id }
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <h2 className="hidden items-center gap-2 text-lg font-semibold sm:flex">
          <MessageCircle className="size-5" />
          Tus conversaciones
        </h2>

        {connections.length === 0 ? (
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
      <FeedbackBubble />
      <BottomNav pendingCount={pendingCount} chatUnread={(unreadData as number) ?? 0} />
    </div>
  )
}
