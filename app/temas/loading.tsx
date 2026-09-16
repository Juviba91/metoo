/**
 * El esqueleto es lo único que trae el prefetch por defecto de `<Link>` en una
 * ruta dinámica, así que tiene que parecerse a lo que viene detrás.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8">
      <div className="space-y-2">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
