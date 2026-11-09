import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import type { Rol } from '@/lib/connections'
import { partirTemas, textosTema, textoPublicaciones, type Tema } from '@/lib/temas'
import type { Metadata } from 'next'
import { Pagina, CabeceraPagina, Volver } from '@/components/pagina'

export const metadata: Metadata = { title: 'Temas' }

export default async function TemasPage() {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const rol = profile.role as Rol

  const [{ data: temasData }, { data: unreadData }, pendingCount] = await Promise.all([
    supabase.rpc('temas_con_actividad'),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
    contarSolicitudesPendientes(),
  ])

  const t = textosTema(rol)
  const { conVida, vacios } = partirTemas((temasData ?? []) as Tema[])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <Pagina ancho="ancho" abajo="burbuja">
        <Volver href="/feed">Feed</Volver>

        <CabeceraPagina titulo="Temas">
          De qué se habla aquí, y cuánta gente hay detrás de cada cosa. Solo números:
          nadie aparece con nombre.
        </CabeceraPagina>

        {conVida.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
            <p className="mb-2 text-3xl">🌱</p>
            <p>Todavía no hay movimiento en ningún tema.</p>
            <p className="mt-1 text-sm">
              Añade los tuyos desde{' '}
              <Link href="/dashboard/perfil/editar" className="text-foreground underline underline-offset-2">
                tu perfil
              </Link>{' '}
              y serás el primero.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {conVida.map((tema) => (
              <div key={tema.id} className="rounded-xl border border-border p-4">
                <p className="font-semibold">#{tema.label}</p>

                <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                  {tema.personas > 0 && (
                    <p className="font-medium text-foreground">{t.personas(tema.personas)}</p>
                  )}
                  {tema.companeros > 0 && <p>{t.companeros(tema.companeros)}</p>}
                  {tema.publicaciones > 0 && (
                    <p>
                      {textoPublicaciones(tema.publicaciones)}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  {tema.personas > 0 && (
                    <Link
                      href={`/dashboard?tag=${encodeURIComponent(tema.slug)}`}
                      className="font-medium text-foreground underline-offset-2 hover:underline"
                    >
                      {t.verPersonas} →
                    </Link>
                  )}
                  <Link
                    href={`/feed?tag=${encodeURIComponent(tema.slug)}`}
                    className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Ver en el feed →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {vacios.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              Todavía sin nadie
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {vacios.map((tema) => (
                <Link
                  key={tema.id}
                  href={`/feed?tag=${encodeURIComponent(tema.slug)}`}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  #{tema.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Si alguno es el tuyo, añádelo a tu perfil: es como dejas de estar solo en él.
            </p>
          </div>
        )}
      </Pagina>

      <SiteFooter className="hidden sm:block" />
      <FeedbackBubble />
      <BottomNav pendingCount={pendingCount} chatUnread={(unreadData as number) ?? 0} />
    </div>
  )
}
