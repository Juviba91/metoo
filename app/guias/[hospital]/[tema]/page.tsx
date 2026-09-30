import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { Logo } from '@/components/logo'
import { agruparPorPregunta, etiquetaAutor, mesYAno, puedeEstarDesfasada } from '@/lib/guias'
import type { Metadata } from 'next'

type Params = Promise<{ hospital: string; tema: string }>

/**
 * Memoizado por petición: `generateMetadata` y la página piden lo mismo, y sin
 * esto cada visita hacía la consulta dos veces. Mismo motivo que `getUser` en
 * lib/supabase/server.
 */
const cargar = cache(async (hospital: string, tema: string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('guias_publicas')
    .select('pregunta_id, orden, enunciado, ayuda, contenido, revisada_en, autor_rol, hospital, ciudad, tema')
    .eq('hospital_slug', hospital)
    .eq('tema_slug', tema)

  return { filas: data ?? [] }
})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { hospital, tema } = await params
  const { filas } = await cargar(hospital, tema)
  const primera = filas[0]

  if (!primera) return { title: 'Guía no encontrada' }

  return {
    title: `${primera.tema} · ${primera.hospital}`,
    description: `Lo que otras familias aprendieron sobre ${primera.tema.toLowerCase()} en ${primera.hospital}: dónde dormir, horarios, trámites y lo práctico que nadie te cuenta.`,
  }
}

/**
 * Una guía: un hospital y un tema. Pública, sin cuenta.
 *
 * Las aportaciones NO llevan firma. El autor se guarda en la base para poder
 * moderar, pero no sale por la vista: es lo que permite tener páginas por
 * hospital sin atar un alias a un hospital y un diagnóstico, que en una ciudad
 * pequeña es un nombre y un apellido.
 */
export default async function GuiaPage({ params }: { params: Params }) {
  const { hospital: hospitalSlug, tema: temaSlug } = await params
  const { filas } = await cargar(hospitalSlug, temaSlug)

  // Una guía sin nada escrito no existe: no se pinta un esqueleto vacío con el
  // nombre de un hospital, que parecería abandonado.
  if (filas.length === 0) notFound()

  const { hospital, ciudad, tema } = filas[0]
  const bloques = agruparPorPregunta(filas)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/">
            <Logo size={28} />
          </Link>
          <Link
            href="/guias"
            className="flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Todas las guías
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tema}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{hospital}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5" /> {ciudad}
        </p>

        {/* Esto va arriba y no en el pie: una página titulada con el nombre de
            un hospital se lee como si la hubiera escrito el hospital. */}
        <div className="mt-8 rounded-xl border-2 border-amber-300/60 bg-amber-50/60 p-4 text-sm leading-relaxed dark:border-amber-800/60 dark:bg-amber-950/20">
          <p className="font-semibold">
            Esto lo escriben personas que han pasado por algo parecido, no el hospital.
          </p>
          <p className="mt-1 text-muted-foreground">
            No es información médica ni oficial, y puede haber cambiado. Para cualquier
            duda sobre tu caso, pregunta al equipo que te atiende.
          </p>
        </div>

        <div className="mt-10 space-y-10">
          {bloques.map((bloque) => (
            <section key={bloque.pregunta_id}>
              <h2 className="text-lg font-semibold">{bloque.enunciado}</h2>
              {bloque.ayuda && (
                <p className="mt-0.5 text-sm text-muted-foreground">{bloque.ayuda}</p>
              )}

              <div className="mt-4 space-y-3">
                {bloque.respuestas.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed"
                  >
                    <p className="whitespace-pre-line">{r.contenido}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {etiquetaAutor(r.autor_rol) && (
                        <span className="rounded-full border border-border px-2 py-0.5">
                          {etiquetaAutor(r.autor_rol)}
                        </span>
                      )}
                      <span>{mesYAno(r.revisada_en)}</span>
                      {puedeEstarDesfasada(r.revisada_en) && (
                        <span className="text-amber-700 dark:text-amber-500">
                          · puede estar desfasado
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-xl border border-border p-6 text-center">
          <p className="font-semibold">¿Has pasado por aquí?</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Lo que tú aprendiste le puede ahorrar horas a quien acaba de llegar.
          </p>
          <Link
            href={`/dashboard/guias?hospital=${hospitalSlug}&tema=${temaSlug}`}
            className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Añadir lo que sepas →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
