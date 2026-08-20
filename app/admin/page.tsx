import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ToggleActiveBtn, DeleteUserBtn, ResolveReportBtn } from './admin-buttons'
import Link from 'next/link'

const ADMIN_EMAIL = 'baygual91@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const admin = createAdminClient()

  const [
    { data: profiles },
    { data: authResult },
    { data: reports },
    { count: connectionCount },
    { count: messageCount },
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

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: 'Usuarios', value: totalUsers },
            { label: 'Voluntarios', value: volunteers },
            { label: 'Buscadores', value: seekers },
            { label: 'Conexiones', value: connectionCount ?? 0 },
            { label: 'Mensajes', value: messageCount ?? 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border p-4 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
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
                          {new Date(r.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <ResolveReportBtn reportId={r.id} />
                        <DeleteUserBtn userId={r.reported_id} alias={(r.profiles as any)?.alias ?? 'este usuario'} />
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
