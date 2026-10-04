import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DashboardMatches } from '@/components/dashboard-matches'
import { BookOpen, MapPin, MessageCircle, UserRound } from 'lucide-react'
import { resendConfirmation } from '@/app/auth/actions'
import { acceptConnection, rejectConnection, toggleAvailability } from '@/app/dashboard/actions'
import { getHiddenUserIds, contarSolicitudesPendientes } from '@/app/safety/actions'
import { conversacionesVisibles, otraParte, otraParteDeBaja, type Rol } from '@/lib/connections'
import type { UserRole } from '@/types/database'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Inicio' }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) redirect('/auth/login')

  // Se llega aquí desde /temas con el tema ya elegido.
  const { tag: temaInicial } = await searchParams

  // El perfil y los bloqueos no dependen entre sí: encadenarlos añadía una
  // ida y vuelta a Supabase antes de poder empezar siquiera las demás.
  const [{ data: profile }, hiddenIds] = await Promise.all([
    supabase
      .from('profiles')
      // Las columnas que se usan, no `*`. Además de traer de menos por la
      // red, `*` ata esta consulta a todas las columnas de la tabla: basta con
      // que una sea nueva y aún no esté migrada, o que tenga la lectura
      // revocada, para que PostgREST rechace la consulta entera y devuelva
      // `null` — que es lo mismo que devuelve un usuario sin perfil, así que
      // el inicio te manda al onboarding en vez de cargar.
      .select('role, alias, city, bio, is_active, profile_hashtags(hashtag_id, hashtags(id, slug, label))')
      .eq('id', user.id)
      .single(),
    getHiddenUserIds(),
  ])

  if (!profile) redirect('/onboarding')

  const oppositeRole = profile.role === 'seeker' ? 'volunteer' : 'seeker'

  let matchesQuery = supabase
    .from('profiles')
    .select('id, alias, city, bio, stage, support_modes, profile_hashtags(hashtag_id, hashtags(id, slug, label))')
    .eq('role', oppositeRole)
    .eq('is_active', true)
    .neq('id', user.id)

  if (hiddenIds.length > 0) {
    matchesQuery = matchesQuery.not('id', 'in', `(${hiddenIds.join(',')})`)
  }

  const rol = profile.role as Rol

  const [
    { data: matches },
    { data: connections },
    { data: unreadData },
    { data: allHashtags },
    { data: guias },
    pendingCount,
  ] = await Promise.all([
    matchesQuery.limit(50),

    profile.role === 'seeker'
      ? supabase
          .from('connections')
          .select('id, status, volunteer_id, volunteer:volunteer_id(alias, city, deleted_at)')
          .eq('seeker_id', user.id)
          .order('created_at', { ascending: false })
      : supabase
          .from('connections')
          .select('id, status, seeker_id, seeker:seeker_id(alias, city, deleted_at, bio, profile_hashtags(hashtag_id, hashtags(id, slug, label)))')
          .eq('volunteer_id', user.id)
          .order('created_at', { ascending: false }),

    supabase.rpc('get_unread_count', { user_uuid: user.id }),

    supabase.from('hashtags').select('id, slug, label').order('label'),

    // Las cuatro con más escrito. El listado entero está en /guias.
    supabase
      .from('guias_indice')
      .select('hospital_slug, hospital, ciudad, tema_slug, tema, aportaciones')
      .order('aportaciones', { ascending: false })
      .limit(4),

    // Dentro del Promise.all, no después: colgando de un `await` propio añadía
    // una ida y vuelta más antes de poder pintar la pestaña.
    rol === 'volunteer' ? contarSolicitudesPendientes() : Promise.resolve(0),
  ])
  const visibleConnections = conversacionesVisibles(
    (connections ?? []) as any[],
    rol,
    hiddenIds,
  )

  // Map otherUserId -> connectionId for non-rejected connections
  const connectedTo = Object.fromEntries(
    visibleConnections
      .filter((c: any) => c.status !== 'rejected')
      .map((c: any) => [otraParte(c, rol), c.id] as const)
      .filter(([otherId]) => Boolean(otherId)),
  ) as Record<string, string>

  const chatUnread = (unreadData as number) ?? 0

  const ownHashtags = (profile.profile_hashtags as any[])
    ?.map((ph: any) => ph.hashtags)
    .filter(Boolean) ?? []

  const statusLabel: Record<string, string> = {
    pending: 'Pendiente',
    accepted: 'Activa',
    rejected: 'Cerrada',
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-6 pb-24 sm:space-y-10 sm:px-6 sm:py-8 sm:pb-8">
        {/* Email confirmation banner */}
        {!user.email_confirmed_at && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ✉️ Confirma tu correo para no perder el acceso a tu cuenta.
            </p>
            <form
              action={async () => {
                'use server'
                await resendConfirmation()
              }}
            >
              <Button type="submit" size="sm" variant="outline" className="shrink-0 text-xs">
                Reenviar
              </Button>
            </form>
          </div>
        )}

        {/* Profile header */}
        <div>
          <h1 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <UserRound className="size-5" />
            {profile.alias}
          </h1>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm text-muted-foreground">
                  {profile.role === 'seeker' ? '🤝 Buscando apoyo' : '💛 Ofreciendo ayuda'}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {profile.city}
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
                )}
                {ownHashtags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {ownHashtags.map((tag: any) => (
                      <span
                        key={tag.id}
                        className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                      >
                        #{tag.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Link
                    href="/dashboard/perfil/editar"
                    className="mt-3 inline-block text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    + Añade hashtags a tu perfil para aparecer en búsquedas
                  </Link>
                )}
              </div>
              <Link
                href="/dashboard/perfil/editar"
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Editar
              </Link>
            </div>

            {profile.role === 'volunteer' && (
              <form action={toggleAvailability.bind(null, !profile.is_active)} className="mt-4 self-start">
                <button
                  type="submit"
                  className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    profile.is_active
                      ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400'
                      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {profile.is_active ? '● Disponible para ayudar' : '○ No disponible'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Guías por hospital.
            A todo el mundo, y no solo a los voluntarios: para quien busca
            apoyo es lo único de la app que sirve ahora mismo, sin esperar a
            que alguien conteste. */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="size-5" />
            Guías
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Dónde dormir, cómo son los horarios de verdad, qué papeles pedir. Lo
            práctico que nadie te cuenta, hospital por hospital.
          </p>

          {(guias ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              <p>Todavía no hay ninguna guía escrita.</p>
              <Link
                href="/guias"
                prefetch
                className="mt-2 inline-block font-medium text-foreground underline-offset-2 hover:underline"
              >
                Ver de qué van →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {(guias ?? []).map((g) => (
                  <Link
                    key={`${g.hospital_slug}/${g.tema_slug}`}
                    href={`/guias/${g.hospital_slug}/${g.tema_slug}`}
                    className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <p className="font-semibold">{g.tema}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{g.hospital}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {g.ciudad}
                    </p>
                  </Link>
                ))}
              </div>
              <Link
                href="/guias"
                prefetch
                className="mt-4 block w-full rounded-lg border border-border py-2.5 text-center text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Ver más
              </Link>
            </>
          )}
        </div>

        {/* Conversations */}
        {visibleConnections.length > 0 && (
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <MessageCircle className="size-5" />
              Tus conversaciones
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(visibleConnections as any[]).map((conn) => {
                const other = profile.role === 'seeker' ? conn.volunteer : conn.seeker
                const seFue = otraParteDeBaja(conn, rol)
                // Una solicitud de quien ya no está no se puede aceptar: se
                // enseña la conversación, pero sin botones que no hacen nada.
                const isPendingVolunteer =
                  conn.status === 'pending' && profile.role === 'volunteer' && !seFue

                if (isPendingVolunteer) {
                  const seekerTags = ((other as any)?.profile_hashtags ?? [])
                    .map((ph: any) => ph.hashtags)
                    .filter(Boolean)
                    .slice(0, 4)
                  return (
                    <div key={conn.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <div className="mb-3">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{other?.alias ?? 'Usuario'}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {other?.city && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" /> {other.city}
                                </span>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/chat/${conn.id}`}
                            className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Ver mensaje →
                          </Link>
                        </div>
                        {(other as any)?.bio && (
                          <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {(other as any).bio}
                          </p>
                        )}
                        {seekerTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {seekerTags.map((tag: any) => (
                              <span
                                key={tag.id}
                                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                              >
                                #{tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <form action={acceptConnection.bind(null, conn.id)} className="flex-1">
                          <Button type="submit" size="sm" className="w-full">
                            Aceptar
                          </Button>
                        </form>
                        <form action={rejectConnection.bind(null, conn.id)} className="flex-1">
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="w-full text-destructive hover:text-destructive"
                          >
                            Rechazar
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                }

                return (
                  <Link
                    key={conn.id}
                    href={`/dashboard/chat/${conn.id}`}
                    className="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <p className="font-semibold">{other?.alias ?? 'Usuario'}</p>
                      {seFue ? (
                        <p className="text-xs text-muted-foreground">Ya no está en metoo</p>
                      ) : (
                        other?.city && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" /> {other.city}
                          </p>
                        )
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        seFue
                          ? 'text-muted-foreground'
                          : conn.status === 'accepted'
                            ? 'text-green-600'
                            : conn.status === 'rejected'
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {seFue ? 'Cuenta eliminada' : (statusLabel[conn.status] ?? conn.status)}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Matches with search */}
        <DashboardMatches
          matches={(matches ?? []) as any}
          role={profile.role as UserRole}
          connectedTo={connectedTo}
          allHashtags={(allHashtags ?? []) as any}
          initialHashtag={temaInicial ?? null}
        />

      </main>

      <SiteFooter className="hidden sm:block" />
      <FeedbackBubble />
      <BottomNav pendingCount={pendingCount} chatUnread={chatUnread} />
    </div>
  )
}
