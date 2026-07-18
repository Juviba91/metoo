export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-14 border-b border-border/60 bg-background" />
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-24 sm:px-6 sm:py-6">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        {/* Composer skeleton */}
        <div className="rounded-xl border border-border p-4 animate-pulse space-y-3">
          <div className="h-20 w-full rounded bg-muted" />
          <div className="h-9 w-24 rounded bg-muted" />
        </div>
        {/* Posts skeleton */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 animate-pulse space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
