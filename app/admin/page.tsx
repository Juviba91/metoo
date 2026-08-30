import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ToggleActiveBtn, DeleteUserBtn, ResolveReportBtn } from './admin-buttons'
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
  const active = profiles?.filter((p) => p.is_active).length ?? 0
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
        <h1 className="text-3xl font-bold">⚙️ Admin</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {([
            { label: 'Usuarios', value: totalUsers, alert: false },
            { label: 'Voluntarios', value: volunteers, alert: false },
            { label: 'Buscadores', value: seekers, alert: false },
            { label: 'Conexiones', value: connectionCount ?? 0, alert: false },
            { label: 'Mensajes', value: messageCount ?? 0, alert: false },
            { label: 'Bloqueos', value: blockCount ?? 0, alert: false },
            { label: 'Emails fallidos', value: failedEmailCount ?? 0, alert: (failedEmailCount ?? 0) > 0 },
            { label: 'Emails en cola', value: pendingEmailCount ?? 0, alert: (pendingEmailCount ?? 0) > 20 },
            { label: 'Rate limits (1h)', value: rateLimitCount ?? 0, alert: false },
          ] as const).map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border p-4 text-center ${
                s.alert ? 'border-destructive/40 bg-destructive/5' : 'border-border'
              }`}
            >
              <p className={`text-2xl font-bold ${s.alert ? 'text-destructive' : ''}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

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

        {/* Users table */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Usuarios ({totalUsers}) — {active} activos
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {['Alias', 'Email', 'Rol', 'Ciudad', '✓', 'Estado', 'Alta', 'Acciones'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(profiles ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{p.alias}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{emailMap[p.id] ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.role === 'volunteer'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      }`}>
                        {p.role === 'volunteer' ? '💛 Vol.' : '🤝 Bus.'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.city}</td>
                    <td className="px-4 py-3 text-center text-xs">
                      {confirmedMap[p.id] ? '✓' : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        p.is_active
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {p.is_active ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <ToggleActiveBtn profileId={p.id} isActive={p.is_active ?? true} />
                        <DeleteUserBtn userId={p.id} alias={p.alias} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  )
}
