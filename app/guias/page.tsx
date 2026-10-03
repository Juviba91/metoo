import { createClient, getUser } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, MapPin, PenLine } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mesYAno } from '@/lib/guias'
import { GuiasShell } from '@/components/guias-shell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guías por hospital',
  description:
    'Lo que otras familias aprendieron en cada hospital: dónde dormir, horarios, trámites y lo que nadie te cuenta.',
}

/**
 * Índice de guías, público y sin cuenta.
 *
 * Se lee sin sesión a propósito: es lo que permite que una asociación reenvíe
 * el enlace y que alguien lo abra a las 3 de la mañana sin registrarse. Por eso
 * esta ruta no está en el matcher del middleware.
 *
 * Solo salen las guías que tienen algo escrito. 20 hospitales por 28 temas son
 * 560 páginas: generarlas todas sería un pueblo fantasma.
 */
export default async function GuiasPage() {
  const supabase = await createClient()

  // Esta página es pública, pero eso no significa que no haya nadie dentro.
  // Sin mirarlo, los enlaces mandaban a registrarse a quien ya tenía sesión, y
  // /auth/login rebota al panel: acabas en Inicio en vez de escribiendo.
  const user = await getUser()
  const haySesion = Boolean(user)
  const aEscribir = haySesion ? '/dashboard/guias' : '/auth/login?tab=register'

  const { data } = await supabase
    .from('guias_indice')
    .select('hospital_slug, hospital, ciudad, tema_slug, tema, aportaciones, ultima')
    .order('aportaciones', { ascending: false })

  const guias = data ?? []

  return (
    <GuiasShell>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="size-5" />
            Guías
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Dónde dormir, cómo son los horarios de verdad, qué papeles pedir, qué llevarte.
            Lo escriben personas que han pasado por algo parecido, no los hospitales.
          </p>
        </div>

        {guias.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
            <p className="mb-2 text-3xl">🌱</p>
            <p>Todavía no hay ninguna guía escrita.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {guias.map((g) => (
              <Link
                key={`${g.hospital_slug}/${g.tema_slug}`}
                href={`/guias/${g.hospital_slug}/${g.tema_slug}`}
                className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
              >
                <p className="font-semibold">{g.tema}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{g.hospital}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {g.ciudad}
                  </span>
                  <span>
                    {g.aportaciones === 1 ? '1 aportación' : `${g.aportaciones} aportaciones`}
                  </span>
                  <span>· {mesYAno(g.ultima)}</span>
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Redactar va después de leer: es leyendo guías cuando se le ocurre a
            alguien que podría añadir la suya. */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <PenLine className="size-5" />
            Redactar
          </h2>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Si has pasado por un hospital, lo que aprendiste le puede ahorrar horas a
              quien acaba de llegar. Dos o tres líneas por pregunta bastan.
            </p>
            <Link href={aEscribir} className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}>
              Contar lo que sé
            </Link>
          </div>
        </div>
      </main>
    </GuiasShell>
  )
}
