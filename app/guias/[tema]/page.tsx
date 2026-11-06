import { cache } from 'react'
import { createClient, getUser } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { agruparPorPregunta, etiquetaAutor, mesYAno, puedeEstarDesfasada } from '@/lib/guias'
import { GuiasShell } from '@/components/guias-shell'
import { EditarRespuesta } from '@/components/editar-respuesta'
import { TeHaServido } from './te-ha-servido'
import type { Metadata } from 'next'

type Params = Promise<{ tema: string }>

/**
 * Memoizado por petición: `generateMetadata` y la página piden lo mismo, y sin
 * esto cada visita hacía la consulta dos veces. Mismo motivo que `getUser` en
 * lib/supabase/server.
 */
const cargar = cache(async (tema: string) => {
  const supabase = await createClient()

  const { data } = await supabase
    .from('guias_publicas')
    .select('id, pregunta_id, orden, enunciado, ayuda, contenido, revisada_en, autor_rol, autor_alias, autor_id, tema')
    .eq('tema_slug', tema)

  return { filas: data ?? [] }
})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tema } = await params
  const { filas } = await cargar(tema)
  const primera = filas[0]

  if (!primera) return { title: 'Guía no encontrada' }

  return {
    title: `Guía: ${primera.tema}`,
    description: `Lo que aprendieron personas que ya pasaron por ${primera.tema.toLowerCase()}: lo práctico que nadie te cuenta.`,
    // Los enlaces que se reparten llevan ?utm_… para medir de dónde vienen:
    // sin canónica, cada variante contaría como una página distinta.
    alternates: { canonical: `/guias/${tema}` },
    // Se lee sin cuenta, pero no se ofrece a los buscadores: un tema de salud
    // y el momento en que alguien lo cuenta pueden bastar para reconocer a una
    // persona, y lo que indexa Google ya no se puede retirar del todo. Esto se
    // mantiene aunque las aportaciones lleven alias (nota legal, medida U-3).
    robots: { index: false, follow: false },
  }
}

/**
 * La guía de un tema. Se lee sin cuenta, pero no se indexa.
 *
 * Cada aportación lleva el alias de quien la escribió. Es un seudónimo, y poder
 * ver quién dice algo es parte de poder valorarlo. No se enlaza al perfil: la
 * ficha de otra persona solo existe si podéis ayudaros (`puedenConectar`), y
 * desde aquí llevaría a un 404 a buena parte de quien lee. El enlace va al
 * revés: del perfil a las guías de esa persona.
 */
export default async function GuiaPage({ params }: { params: Params }) {
  const { tema: temaSlug } = await params
  const [{ filas }, user] = await Promise.all([cargar(temaSlug), getUser()])

  // Una guía sin nada escrito no existe: no se pinta un esqueleto vacío, que
  // parecería abandonado.
  if (filas.length === 0) notFound()

  const { tema } = filas[0]
  const bloques = agruparPorPregunta(filas)

  return (
    <GuiasShell>
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <Link
          href="/guias"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Guías
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{tema}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lo que cuentan personas que ya pasaron por esto.
          </p>
        </div>

        {/* Arriba y no en el pie: hay que leerlo antes que nada. */}
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm leading-relaxed dark:border-amber-800/60 dark:bg-amber-950/20">
          <p className="font-semibold">
            Esto lo escriben personas que han pasado por algo parecido, no un hospital ni un
            profesional.
          </p>
          <p className="mt-1 text-muted-foreground">
            No es información médica ni oficial, y puede haber cambiado. Para cualquier
            duda sobre tu caso, pregunta al equipo que te atiende.
          </p>
        </div>

        <div className="space-y-8">
          {bloques.map((bloque) => (
            <section key={bloque.pregunta_id}>
              <h2 className="font-semibold">{bloque.enunciado}</h2>
              {bloque.ayuda && (
                <p className="mt-0.5 text-sm text-muted-foreground">{bloque.ayuda}</p>
              )}

              <div className="mt-3 space-y-3">
                {bloque.respuestas.map((r, i) => {
                  const meta = (
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      {r.autor_alias && (
                        <span className="font-medium text-foreground">{r.autor_alias}</span>
                      )}
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
                  )
                  // Las tuyas se pueden corregir; las de los demás, no.
                  const esMia = Boolean(user && r.id && r.autor_id === user.id)

                  return (
                    <div
                      key={r.id ?? i}
                      className="rounded-xl border border-border p-4 text-sm leading-relaxed"
                    >
                      {esMia ? (
                        <EditarRespuesta id={r.id!} contenido={r.contenido}>
                          {meta}
                        </EditarRespuesta>
                      ) : (
                        <>
                          <p className="whitespace-pre-line">{r.contenido}</p>
                          {meta}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <TeHaServido temaSlug={temaSlug} />

        <div className="rounded-xl border border-border p-4">
          <p className="font-semibold">¿Has pasado por aquí?</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Lo que tú aprendiste le puede ahorrar horas a quien acaba de llegar.
          </p>
          <Link
            href={`/dashboard/guias?tema=${temaSlug}`}
            className={cn(buttonVariants({ size: 'sm' }), 'mt-3')}
          >
            Añadir lo que sepas
          </Link>
        </div>

        {/* Sin Google (noindex), estas páginas llegan en papel: a las salas de
            espera y a las asociaciones. */}
        <p className="text-center text-xs text-muted-foreground">
          ¿Quieres dejarla en una sala de espera?{' '}
          <Link
            href={`/guias/${temaSlug}/cartel`}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Imprime un cartel con QR
          </Link>
        </p>
      </main>
    </GuiasShell>
  )
}
