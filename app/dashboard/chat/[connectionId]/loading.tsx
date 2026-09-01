import { SiteHeaderShell } from '@/components/site-header'

export default function ChatLoading() {
  return (
    // Sin barra inferior a propósito: el chat es pantalla completa.
    <div className="flex h-dvh flex-col bg-background">
      <SiteHeaderShell />

      {/* Cabecera de la conversación: esta sí es esqueleto, porque el nombre
          de la otra persona no se sabe hasta resolver los datos. */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-2.5">
        <div className="size-8 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </header>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-4 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`h-10 animate-pulse rounded-2xl bg-muted ${i % 2 === 0 ? 'w-48' : 'w-36'}`}
            />
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="pb-safe flex shrink-0 items-center gap-2 border-t border-border bg-background px-4 pt-3">
        <div className="h-11 flex-1 animate-pulse rounded-full bg-muted" />
        <div className="size-11 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  )
}
