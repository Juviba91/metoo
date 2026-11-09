import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HandHeart, Pencil } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProfileCard } from '@/components/profile-card'
import { GuiasDePerfil } from '@/components/guias-de-perfil'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteFooter } from '@/components/site-footer'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import { HowItWorks } from '@/components/how-it-works'
import { esDoble, ladoQueInvitar, ladosDe } from '@/lib/lados'
import type { Metadata } from 'next'
import { Pagina } from '@/components/pagina'

export const metadata: Metadata = { title: 'Perfil' }

/**
 * Tu perfil, tal como lo ve quien te encuentra.
 *
 * Antes esta pestaña era directamente el formulario, y no había forma de ver
 * tu propia ficha: solo campos para rellenar. Ahora se ve la misma tarjeta que
 * ven los demás, y editar es una pantalla aparte.
 */
export default async function PerfilPage() {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) redirect('/auth/login')

  const [{ data: profile }, pendingCount, { data: unreadData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('alias, city, bio, role, is_active, stage, support_modes, created_at, profile_hashtags(hashtag_id, role, hashtags(id, slug, label))')
      .eq('id', user.id)
      .single(),
    contarSolicitudesPendientes(),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
  ])

  if (!profile) redirect('/onboarding')

  const hashtags = ((profile.profile_hashtags ?? []) as any[])
    .filter((ph) => ph.hashtags)
    .map((ph) => ({ ...ph.hashtags, role: ph.role }))

  const lados = ladosDe(profile.role, profile.profile_hashtags ?? [])
  const doble = esDoble(lados)
  const invitar = ladoQueInvitar(lados, profile.created_at)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <Pagina abajo="burbuja">
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            {doble
              ? 'Así te ven los demás. A cada persona solo le salen los temas en los que os podéis ayudar.'
              : `Así te ve ${lados.acompana ? 'quien busca apoyo' : 'quien ofrece ayuda'}.`}
          </p>

          <ProfileCard
            perfil={{ ...profile, hashtags }}
            etiqueta={doble ? '💛 Acompañando · 🤝 Buscando apoyo' : undefined}
            marcarLado={doble}
          >
            {lados.acompana && !profile.is_active && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                Ahora mismo no estás disponible: no apareces en las búsquedas y nadie puede escribirte.
              </p>
            )}
            <Link
              href="/dashboard/perfil/editar"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full gap-2')}
            >
              <Pencil className="size-4" /> Editar perfil
            </Link>
          </ProfileCard>

          <GuiasDePerfil userId={user.id} propio />
        </div>

        {/* Estar a los dos lados funcionaba, pero nadie sabía que se podía. */}
        {invitar && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <HandHeart className="size-4" />
              {invitar === 'buscar'
                ? '¿Ahora eres tú quien lo está pasando?'
                : '¿Te ves con fuerzas para acompañar a alguien?'}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {invitar === 'buscar'
                ? 'Acompañar no te quita el derecho a que te acompañen. Añade el tema que estás viviendo y marca «Lo estoy viviendo»: seguirás acompañando en lo tuyo y verás a quien ya pasó por lo nuevo.'
                : 'Si algo de lo que viviste ya lo llevas mejor, puedes acompañar en ese tema a quien empieza. Marca «Lo viví» en él; en lo demás sigues buscando apoyo igual.'}
            </p>
            <Link
              href="/dashboard/perfil/editar"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}
            >
              {invitar === 'buscar' ? 'Añadir lo que estoy viviendo' : 'Elegir en qué puedo acompañar'}
            </Link>
          </div>
        )}

        <div className="border-t border-border/60 pt-8">
          <HowItWorks />
        </div>
      </Pagina>

      <SiteFooter className="hidden sm:block" />
      <FeedbackBubble />
      <BottomNav
        pendingCount={pendingCount}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
