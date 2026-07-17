import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MapPin, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'

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

  const { data: connections } = await connectionsQuery

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-4">
          <MessageCircle className="size-5 text-muted-foreground" />
          <span className="text-xl font-bold tracking-tight">Conversaciones</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
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
              return (
                <Link
                  key={conn.id}
                  href={`/dashboard/chat/${conn.id}`}
                  className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="font-semibold">{other?.alias ?? 'Usuario'}</p>
                    {other?.city && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
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
        )}
      </main>

      <BottomNav />
    </div>
  )
}
