import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import { BottomNav } from '@/components/bottom-nav'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CajaPregunta, Selectores } from './guia-form'
import { AvisoPublicacion } from './aviso-publicacion'
import type { Metadata } from 'next'
import { Pagina, CabeceraPagina, Volver } from '@/components/pagina'

export const metadata: Metadata = { title: 'Redacta tu guía' }

export default async function EscribirGuiaPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string }>
}) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const { tema: temaSlug = null } = await searchParams

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, profile_hashtags(hashtags(slug, label))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  // Los temas del perfil se siguen leyendo, pero ya no limitan: se usan para
  // ponerlos primero en el desplegable. Escribir de lo que has vivido es lo
  // normal, y lo normal se pone a mano, no se impone.
  const mios = new Set(
    ((profile.profile_hashtags ?? []) as { hashtags: { slug: string } | null }[])
      .map((ph) => ph.hashtags?.slug)
      .filter((s): s is string => Boolean(s)),
  )

  const [
    { data: todosLosTemas },
    { data: preguntas },
    { data: yaHay },
    pendingCount,
    { data: unreadData },
  ] = await Promise.all([
      supabase.from('hashtags').select('slug, label').order('label'),
      temaSlug
        ? supabase
            .from('guia_preguntas')
            .select('id, orden, enunciado, ayuda, hashtag_id, hashtags(slug)')
            .eq('activa', true)
            .order('orden')
        : Promise.resolve({ data: [] }),
      temaSlug
        ? supabase.from('guias_publicas').select('pregunta_id').eq('tema_slug', temaSlug)
        : Promise.resolve({ data: [] }),
      contarSolicitudesPendientes(),
      supabase.rpc('get_unread_count', { user_uuid: user.id }),
    ])

  // Los tuyos arriba: es lo que vas a elegir nueve de cada diez veces.
  const temas = [...((todosLosTemas ?? []) as { slug: string; label: string }[])].sort(
    (a, b) =>
      Number(mios.has(b.slug)) - Number(mios.has(a.slug)) ||
      a.label.localeCompare(b.label, 'es'),
  )

  // Las generales (sin tema) más las del tema elegido.
  const preguntasDelTema = ((preguntas ?? []) as {
    id: string
    orden: number
    enunciado: string
    ayuda: string | null
    hashtag_id: string | null
    hashtags: { slug: string } | null
  }[]).filter((p) => p.hashtag_id === null || p.hashtags?.slug === temaSlug)

  const cuantasPorPregunta = ((yaHay ?? []) as { pregunta_id: string }[]).reduce<
    Record<string, number>
  >((acc, r) => {
    acc[r.pregunta_id] = (acc[r.pregunta_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <Pagina>
        <Volver href="/guias">Guías</Volver>

        <CabeceraPagina titulo="Redacta tu guía">
          Lo práctico que nadie te contó y que a ti te habría ahorrado horas. Va a la guía
          del tema que elijas, que puede leer cualquiera.
        </CabeceraPagina>

        {temas.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            <p>Todavía no hay temas en el catálogo.</p>
          </div>
        ) : (
          <>
            {/* Se dice ANTES de escribir, y hay que marcarlo: lo que se
                escriba queda público y con tu alias. */}
            <AvisoPublicacion>
              <Selectores temas={temas} temaSlug={temaSlug} />

              {temaSlug ? (
                <div className="space-y-3">
                  {preguntasDelTema.map((p) => (
                    <CajaPregunta
                      key={p.id}
                      temaSlug={temaSlug}
                      preguntaId={p.id}
                      enunciado={p.enunciado}
                      ayuda={p.ayuda}
                      yaRespondida={cuantasPorPregunta[p.id] ?? 0}
                    />
                  ))}
                  <p className="pt-2 text-center text-xs text-muted-foreground">
                    Contesta solo lo que sepas. Cada respuesta se guarda por su cuenta, y
                    puedes volver otro día a por el resto.
                  </p>
                  {/* Solo si la guía ya tiene algo escrito. La página pública
                      hace notFound() cuando está vacía —para que no haya páginas
                      fantasma— así que este enlace daba un 404 justo al abrir el
                      formulario, que es cuando más apetece pulsarlo. */}
                  {Object.keys(cuantasPorPregunta).length > 0 ? (
                    <p className="text-center text-xs">
                      <Link
                        href={`/guias/${temaSlug}`}
                        className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        Ver cómo queda la página →
                      </Link>
                    </p>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">
                      Esta guía todavía está vacía. En cuanto escribas algo tendrá su
                      propia página.
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Elige un tema para ver las preguntas.
                </p>
              )}
            </AvisoPublicacion>
          </>
        )}
      </Pagina>

      <SiteFooter className="hidden sm:block" />
      <BottomNav pendingCount={pendingCount} chatUnread={(unreadData as number) ?? 0} />
    </div>
  )
}
