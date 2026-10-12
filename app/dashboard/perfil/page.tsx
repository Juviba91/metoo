import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProfileCard } from '@/components/profile-card'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { FeedbackBubble } from '@/components/feedback-bubble'
import { SiteFooter } from '@/components/site-footer'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import { HowItWorks } from '@/components/how-it-works'
import { esDoble, ladosDe } from '@/lib/lados'
import type { Metadata } from 'next'

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
      .select('alias, city, bio, role, is_active, stage, support_modes, profile_hashtags(hashtag_id, role, hashtags(id, slug, label))')
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
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
        </div>

        <div className="border-t border-border/60 pt-8">
          <HowItWorks />
        </div>
      </main>

      <SiteFooter className="hidden sm:block" />
      <FeedbackBubble />
      <BottomNav
        pendingCount={pendingCount}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
