import { SiteHeaderShell } from '@/components/site-header'

export default function EquipoLoading() {
  return (
    // A pantalla completa y sin barra inferior, como el chat: sin esto se veía
    // el esqueleto de Inicio antes de la conversación.
    <div className="flex h-dvh flex-col bg-background">
      <SiteHeaderShell />

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col md:border-x md:border-border/60">
        <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-2.5">
          <div className="size-8 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-4 py-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`h-10 animate-pulse rounded-2xl bg-muted ${i % 2 === 0 ? 'w-56' : 'w-36'}`} />
            </div>
          ))}
        </div>

        <div className="pb-safe flex shrink-0 items-center gap-2 border-t border-border bg-background px-4 pt-3">
          <div className="h-11 flex-1 animate-pulse rounded-full bg-muted" />
          <div className="size-11 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  )
}
