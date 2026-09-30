import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import { BottomNav } from '@/components/bottom-nav'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CajaPregunta, Selectores } from './guia-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Escribir una guía' }

export default async function EscribirGuiaPage({
  searchParams,
}: {
  searchParams: Promise<{ hospital?: string; tema?: string }>
}) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const { hospital: hospitalSlug = null, tema: temaSlug = null } = await searchParams

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, alias, profile_hashtags(hashtags(slug, label))')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const esVoluntario = profile.role === 'volunteer'

  // Los temas del perfil se siguen leyendo, pero ya no limitan: se usan para
  // ponerlos primero en el desplegable. Escribir de lo que has vivido es lo
  // normal, y lo normal se pone a mano, no se impone.
  const mios = new Set(
    ((profile.profile_hashtags ?? []) as { hashtags: { slug: string } | null }[])
      .map((ph) => ph.hashtags?.slug)
      .filter((s): s is string => Boolean(s)),
  )

  const [
    { data: hospitales },
    { data: todosLosTemas },
    { data: preguntas },
    { data: yaHay },
    pendingCount,
    { data: unreadData },
  ] = await Promise.all([
      supabase.from('hospitals').select('slug, name, city').order('name'),
      supabase.from('hashtags').select('slug, label').order('label'),
      temaSlug
        ? supabase
            .from('guia_preguntas')
            .select('id, orden, enunciado, ayuda, hashtag_id, hashtags(slug)')
            .eq('activa', true)
            .order('orden')
        : Promise.resolve({ data: [] }),
      hospitalSlug && temaSlug
        ? supabase
            .from('guias_publicas')
            .select('pregunta_id')
            .eq('hospital_slug', hospitalSlug)
            .eq('tema_slug', temaSlug)
        : Promise.resolve({ data: [] }),
      esVoluntario ? contarSolicitudesPendientes() : Promise.resolve(0),
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

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <div>
          <h1 className="text-lg font-semibold">Cuenta lo que aprendiste</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Lo práctico que nadie te contó y que a ti te habría ahorrado horas. Va a una
            página del hospital que puede leer cualquiera.
          </p>
        </div>

        {temas.length === 0 ? (
          <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            <p>Todavía no hay temas en el catálogo.</p>
          </div>
        ) : (
          <>
            {/* Se dice ANTES de escribir, no después: lo que se escriba queda
                público en internet, aunque sin tu alias. */}
            <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm leading-relaxed dark:border-amber-800/60 dark:bg-amber-950/20">
              <p className="font-semibold">Esto se publica, y con tu alias</p>
              <p className="mt-1 text-muted-foreground">
                Lo que escribas lo podrá leer cualquiera en internet, también sin tener
                cuenta, y aparecerá firmado como{' '}
                <strong className="text-foreground">{profile.alias}</strong>. No cuentes
                nada que te pueda identificar —ni fechas exactas, ni nombres de personas
                del hospital— y nada sobre tratamientos o medicación.
              </p>
            </div>

            <Selectores
              hospitales={hospitales ?? []}
              temas={temas}
              hospitalSlug={hospitalSlug}
              temaSlug={temaSlug}
            />

            {hospitalSlug && temaSlug ? (
              <div className="space-y-3">
                {preguntasDelTema.map((p) => (
                  <CajaPregunta
                    key={p.id}
                    hospitalSlug={hospitalSlug}
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
                <p className="text-center text-xs">
                  <Link
                    href={`/guias/${hospitalSlug}/${temaSlug}`}
                    className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Ver cómo queda la página →
                  </Link>
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Elige un hospital y un tema para ver las preguntas.
              </p>
            )}
          </>
        )}
      </main>

      <SiteFooter className="hidden sm:block" />
      <BottomNav pendingCount={pendingCount} chatUnread={(unreadData as number) ?? 0} />
    </div>
  )
}
