export default function PerfilLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 border-b border-border/60 bg-background" />
      <main className="mx-auto w-full max-w-lg space-y-8 px-6 py-8 pb-28 sm:pb-8">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />

        {/* Formulario */}
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-1.5">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-12 w-full rounded-lg bg-muted" />
            </div>
          ))}
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-12 w-full rounded-lg bg-muted" />
            <div className="flex flex-wrap gap-2 pt-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 w-24 rounded-full bg-muted" />
              ))}
            </div>
          </div>
          <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
        </div>

        {/* Cuenta */}
        <div className="mt-12 space-y-4 border-t border-border/60 pt-8">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </main>
    </div>
  )
}
