import { createClient, getUser } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, PenLine } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mesYAno } from '@/lib/guias'
import { GuiasShell } from '@/components/guias-shell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guías',
  description:
    'Lo que escriben personas que han pasado por esa experiencia: lo práctico que nadie te cuenta.',
  alternates: { canonical: '/guias' },
}

/**
 * Índice de guías, público y sin cuenta.
 *
 * Se lee sin sesión a propósito: es lo que permite que una asociación reenvíe
 * el enlace y que alguien lo abra a las 3 de la mañana sin registrarse. Por eso
 * esta ruta no está en el matcher del middleware.
 *
 * Una guía por tema, y solo salen las que tienen algo escrito: generarlas todas
 * sería un pueblo fantasma.
 */
export default async function GuiasPage() {
  const supabase = await createClient()

  // Esta página es pública, pero eso no significa que no haya nadie dentro.
  // Sin mirarlo, los enlaces mandaban a registrarse a quien ya tenía sesión, y
  // /auth/login rebota al panel: acabas en Inicio en vez de escribiendo.
  const user = await getUser()
  const aEscribir = user ? '/dashboard/guias' : '/auth/login'

  const { data } = await supabase
    .from('guias_temas')
    .select('tema_slug, tema, aportaciones, ultima')
    .order('aportaciones', { ascending: false })

  const guias = data ?? []

  return (
    <GuiasShell>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-6 pb-36 sm:px-6 sm:py-8 sm:pb-8">
        <div>
          {/* Con sesión, el título ya está en la cabecera del móvil; sin ella no. */}
          <h1 className={cn('text-2xl font-bold', user && 'hidden sm:block')}>Guías</h1>
          <p className={cn("text-base leading-relaxed text-muted-foreground", !user && "mt-1", "sm:mt-1")}>
            Lo que escriben personas que han pasado por esa experiencia.
          </p>
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="size-5" />
            Guías ya elaboradas
          </h2>

          {guias.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <p className="mb-2 text-3xl">🌱</p>
              <p>Todavía no hay ninguna guía escrita. Puedes ser la primera persona.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {guias.map((g) => (
                <Link
                  key={g.tema_slug}
                  href={`/guias/${g.tema_slug}`}
                  className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <p className="font-semibold">{g.tema}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {g.aportaciones === 1 ? '1 aportación' : `${g.aportaciones} aportaciones`}
                    {' · '}
                    {mesYAno(g.ultima)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Redactar va después de leer: es leyendo guías cuando se le ocurre a
            alguien que podría añadir la suya. */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <PenLine className="size-5" />
            Redacta tu guía
          </h2>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Si has pasado por algo parecido, lo que aprendiste le puede ahorrar horas a
              quien acaba de llegar. Eliges un tema, contestas lo que sepas y dos o tres
              líneas por pregunta bastan.
            </p>
            <Link href={aEscribir} className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}>
              Escribir mi guía
            </Link>
          </div>
        </div>
      </main>
    </GuiasShell>
  )
}
