import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { Logo } from '@/components/logo'
import { mesYAno } from '@/lib/guias'
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

  const { data } = await supabase
    .from('guias_indice')
    .select('hospital_slug, hospital, ciudad, tema_slug, tema, aportaciones, ultima')
    .order('aportaciones', { ascending: false })

  const guias = data ?? []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/">
            <Logo size={28} />
          </Link>
          <Link
            href="/auth/login?tab=register"
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Lo que aprendieron otras familias
        </h1>
        <p className="mb-2 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Dónde dormir, cómo son los horarios de verdad, qué papeles pedir, qué llevarte.
          Lo práctico que nadie te cuenta, hospital por hospital.
        </p>
        <p className="mb-10 max-w-2xl text-sm text-muted-foreground">
          Lo escriben personas que han pasado por ahí, no los hospitales. No hace falta
          cuenta para leerlo.
        </p>

        {guias.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
            <p className="mb-2 text-3xl">🌱</p>
            <p>Todavía no hay ninguna guía escrita.</p>
            <p className="mt-1 text-sm">
              Si has pasado por un hospital y quieres contar lo que aprendiste,{' '}
              <Link
                href="/auth/login?tab=register"
                className="text-foreground underline underline-offset-2"
              >
                puedes ser el primero
              </Link>
              .
            </p>
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
      </main>

      <SiteFooter />
    </div>
  )
}
