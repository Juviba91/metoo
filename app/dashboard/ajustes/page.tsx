import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { SiteFooter } from '@/components/site-footer'
import { AccountSection } from '@/app/dashboard/perfil/account-section'
import { DeleteAccount } from '@/app/dashboard/perfil/delete-account'
import { AppAbout } from '@/components/app-about'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Ajustes' }

/**
 * Los ajustes de la cuenta, en su propia pantalla y alcanzables desde la
 * cabecera.
 *
 * Estaban al final del perfil, y el perfil es donde editas lo que la gente ve
 * de ti: dos cosas distintas mezcladas en una página larga. El correo, los
 * avisos y eliminar la cuenta no se tocan casi nunca, pero cuando los buscas
 * los buscas a propósito, y para eso sirve un sitio fijo arriba.
 */
export default async function AjustesPage() {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, pendingCount, { data: unreadData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, email_notifications_enabled, digest_enabled')
      .eq('id', user.id)
      .single(),
    contarSolicitudesPendientes(),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
  ])

  if (!profile) redirect('/onboarding')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-8 px-6 py-8 pb-28 sm:pb-8">
        <Link
          href="/dashboard/perfil"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Perfil
        </Link>

        <h1 className="text-2xl font-bold">Ajustes de la cuenta</h1>

        <div>
          <h2 className="mb-4 text-sm font-semibold">Cuenta</h2>
          <AccountSection
            email={user.email}
            emailConfirmed={!!user.email_confirmed_at}
            emailNotificationsEnabled={profile.email_notifications_enabled}
            digestEnabled={profile.digest_enabled}
            esVoluntario={profile.role === 'volunteer'}
          />
        </div>

        <div className="border-t border-border/60 pt-8">
          <h2 className="mb-1 text-sm font-semibold text-destructive">Eliminar cuenta</h2>
          <DeleteAccount />
        </div>

        <div className="border-t border-border/60 pt-8">
          <AppAbout />
        </div>
      </main>

      <SiteFooter className="hidden sm:block" />
      <BottomNav
        pendingCount={profile.role === 'volunteer' ? pendingCount : 0}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
