import { Pagina } from '@/components/pagina'
import { SiteHeaderShell } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'

export default function ChatsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeaderShell />
      <Pagina ancho="ancho" abajo="burbuja">
        <div className="grid gap-3 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 animate-pulse space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
          ))}
        </div>
      </Pagina>

      {/* Navegación real: durante la carga se puede cambiar de pestaña.
          Los contadores llegan a 0 y se rellenan cuando la página resuelve. */}
      <BottomNav />
    </div>
  )
}
