import { SiteHeaderShell } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'

export default function PublicProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderShell />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <div className="mb-6 h-5 w-20 animate-pulse rounded bg-muted" />

        <div className="animate-pulse rounded-xl border border-border p-5 sm:p-6">
          <div className="mb-4 space-y-2">
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-7 w-44 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 w-24 rounded-full bg-muted" />
            ))}
          </div>

          <div className="mb-5 space-y-2">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>

          <div className="space-y-3">
            <div className="h-10 w-full rounded-lg bg-muted" />
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        </div>
      </main>

      {/* Navegación real: durante la carga se puede cambiar de pestaña.
          Los contadores llegan a 0 y se rellenan cuando la página resuelve. */}
      <BottomNav />
    </div>
  )
}
