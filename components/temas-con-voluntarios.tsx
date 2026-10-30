import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

type Fila = { slug: string; label: string; voluntarios: number }

/**
 * Los temas en los que hay alguien acompañando, con cuántas personas, para
 * verlo ANTES de crear la cuenta. Solo recuentos (`voluntarios_por_tema`):
 * ninguna ficha sale de la app sin sesión.
 *
 * Con el cliente sin cookies a propósito: así la portada sigue siendo
 * estática (se regenera cada hora) y no paga una ida a la base por visita.
 * Si la función aún no existe o falla, no se pinta nada.
 */
export async function TemasConVoluntarios() {
  let filas: Fila[] = []
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data } = await supabase.rpc('voluntarios_por_tema')
    filas = ((data ?? []) as Fila[]).filter((f) => f.voluntarios > 0).slice(0, 12)
  } catch {
    return null
  }

  if (filas.length === 0) return null

  return (
    <section className="mx-auto max-w-3xl px-6 pb-4 text-center">
      <p className="mb-3 text-sm text-muted-foreground">Ahora mismo hay quien acompaña en:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {filas.map((f) => (
          <Link
            key={f.slug}
            href={`/auth/login?next=${encodeURIComponent(`/dashboard?tema=${f.slug}`)}`}
            className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            #{f.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              {f.voluntarios} {f.voluntarios === 1 ? 'persona' : 'personas'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
