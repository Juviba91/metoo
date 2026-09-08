import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DeleteUserBtn, ResolveReportBtn, BorrarComentarioBtn } from './admin-buttons'
import { StatsGrid } from './stats-grid'
import { UsersSection } from './users-section'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin' }

const ADMIN_EMAIL = 'baygual91@gmail.com'

export default async function AdminPage() {
  const user = await getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const admin = createAdminClient()

  // react-hooks/purity está pensada para componentes de cliente: aquí estamos
  // en un Server Component asíncrono que se ejecuta una vez por petición, así
  // que leer el reloj es correcto.
  // eslint-disable-next-line react-hooks/purity
  const lastHour = new Date(Date.now() - 3600_000).toISOString()

  const [
    { data: profiles },
    { data: authResult },
    { data: reports },
    { count: connectionCount },
    { count: messageCount },
    { count: blockCount },
    { count: failedEmailCount },
    { count: pendingEmailCount },
    { count: rateLimitCount },
    { data: feedback },
    { data: suggestions },
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id, alias, role, city, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(500),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin
      .from('reports')
      .select('id, reporter_id, reported_id, reason, description, resolved, created_at, profiles!reported_id(alias)')
      .order('created_at', { ascending: false })
      .limit(50),
    admin.from('connections').select('id', { count: 'exact', head: true }),
    admin.from('messages').select('id', { count: 'exact', head: true }),
    admin.from('blocks').select('id', { count: 'exact', head: true }),
    admin.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    admin.from('email_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('rate_limits').select('id', { count: 'exact', head: true }).gte('window_start', lastHour),
    admin
      .from('feedback')
      .select('id, content, created_at, profiles!profile_id(alias)')
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('hashtag_suggestions')
      .select('id, suggestion, created_at, profiles!profile_id(alias)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const emailMap = Object.fromEntries(
    (authResult?.users ?? []).map((u) => [u.id, u.email ?? '—']),
  )
  const confirmedMap = Object.fromEntries(
    (authResult?.users ?? []).map((u) => [u.id, !!u.email_confirmed_at]),
  )

  const totalUsers = profiles?.length ?? 0
  const volunteers = profiles?.filter((p) => p.role === 'volunteer').length ?? 0
  const seekers = profiles?.filter((p) => p.role === 'seeker').length ?? 0
  const pendingReports = reports?.filter((r) => !r.resolved).length ?? 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xl font-bold tracking-tight">metoo.</Link>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Admin
            </span>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <h1 className="text-3xl font-bold">Admin</h1>

        {/* Reports */}
        {pendingReports > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              Reportes pendientes
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                {pendingReports}
              </span>
            </h2>
            <div className="space-y-3">
              {reports
                ?.filter((r) => !r.resolved)
                .map((r) => (
                  <div key={r.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Reportado:</span>{' '}
                          {(r.profiles as any)?.alias ?? r.reported_id}
                        </p>
                        <p><span className="font-medium">Razón:</span> {r.reason}</p>
                        {r.description && (
                          <p className="text-muted-foreground">{r.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <ResolveReportBtn reportId={r.id} />
                        {/* reported_id se pone a NULL si la cuenta ya fue eliminada */}
                        {r.reported_id && (
                          <DeleteUserBtn
                            userId={r.reported_id}
                            alias={(r.profiles as any)?.alias ?? 'este usuario'}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Lo que escribe la gente: antes se guardaba y no lo leía nadie */}
        {((feedback?.length ?? 0) > 0 || (suggestions?.length ?? 0) > 0) && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">Lo que nos cuentan</h2>
            <div className="space-y-3">
              {(feedback ?? []).map((f: any) => (
                <div key={`f-${f.id}`} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">
                      {f.content}
                    </p>
                    <BorrarComentarioBtn tabla="feedback" id={f.id} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {(f.profiles as any)?.alias ?? 'cuenta eliminada'} ·{' '}
                    {f.created_at
                      ? new Date(f.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              ))}
              {(suggestions ?? []).map((s: any) => (
                <div key={`s-${s.id}`} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 break-words text-sm">
                      <span className="mr-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        hashtag
                      </span>
                      {s.suggestion}
                    </p>
                    <BorrarComentarioBtn tabla="hashtag_suggestions" id={s.id} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {(s.profiles as any)?.alias ?? 'cuenta eliminada'} ·{' '}
                    {s.created_at
                      ? new Date(s.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Primero lo que hay que leer; los números, después: en el móvil había
            que bajar media pantalla de tarjetas antes de llegar a nada. */}
        <StatsGrid
          metricas={[
            { label: 'Usuarios', value: totalUsers },
            { label: 'Voluntarios', value: volunteers },
            { label: 'Buscadores', value: seekers },
            { label: 'Conexiones', value: connectionCount ?? 0 },
            { label: 'Mensajes', value: messageCount ?? 0 },
            { label: 'Bloqueos', value: blockCount ?? 0 },
            { label: 'Emails fallidos', value: failedEmailCount ?? 0, alert: (failedEmailCount ?? 0) > 0 },
            { label: 'Emails en cola', value: pendingEmailCount ?? 0, alert: (pendingEmailCount ?? 0) > 20 },
            { label: 'Rate limits (1h)', value: rateLimitCount ?? 0 },
            { label: 'Feedback', value: feedback?.length ?? 0 },
          ]}
        />

        <UsersSection
          usuarios={(profiles ?? []).map((u: any) => ({
            id: u.id,
            alias: u.alias,
            role: u.role,
            city: u.city,
            is_active: u.is_active,
            created_at: u.created_at,
            email: emailMap[u.id] ?? '—',
            confirmado: !!confirmedMap[u.id],
          }))}
        />

      </main>
    </div>
  )
}
