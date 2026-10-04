import { SiteHeaderShell } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'

export default function PerfilLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderShell />
      <main className="mx-auto w-full max-w-2xl space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <div>
          <div className="mb-3 h-4 w-48 animate-pulse rounded bg-muted" />
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
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
