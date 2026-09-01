import { SiteHeaderShell } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderShell />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8">
        {/* Profile card skeleton */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-6 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-7 w-40 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
            <div className="h-7 w-14 rounded bg-muted" />
          </div>
        </div>

        {/* Matches skeleton */}
        <div>
          <div className="mb-4 h-6 w-48 rounded bg-muted animate-pulse" />
          <div className="mb-3 h-10 w-full rounded-lg bg-muted animate-pulse" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-5 animate-pulse space-y-3">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-10 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Navegación real: durante la carga se puede cambiar de pestaña.
          Los contadores llegan a 0 y se rellenan cuando la página resuelve. */}
      <BottomNav />
    </div>
  )
}
