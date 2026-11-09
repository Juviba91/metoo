import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { SiteFooter } from '@/components/site-footer'
import { AccountSection } from '@/app/dashboard/perfil/account-section'
import { DeleteAccount } from '@/app/dashboard/perfil/delete-account'
import { AppAbout } from '@/components/app-about'
import { AvisosMovil } from '@/components/avisos-movil'
import { InstalarApp } from '@/components/instalar-app'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import { ladosDe } from '@/lib/lados'
import type { Metadata } from 'next'
import { Pagina, CabeceraPagina, Volver } from '@/components/pagina'

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
      .select('role, email_notifications_enabled, digest_enabled, profile_hashtags(role)')
      .eq('id', user.id)
      .single(),
    contarSolicitudesPendientes(),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
  ])

  if (!profile) redirect('/onboarding')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <Pagina ancho="estrecho">
        <Volver href="/dashboard/perfil">Perfil</Volver>

        <CabeceraPagina titulo="Ajustes de la cuenta" />

        <div>
          <h2 className="mb-4 text-sm font-semibold">Cuenta</h2>
          <AccountSection
            email={user.email}
            emailConfirmed={!!user.email_confirmed_at}
            emailNotificationsEnabled={profile.email_notifications_enabled}
            digestEnabled={profile.digest_enabled}
            // El resumen semanal es para quien acompaña, en algún tema: una
            // cuenta registrada buscando apoyo que marcó «lo viví» en otro
            // tema también lo recibe (ver voluntarios_a_avisar).
            esVoluntario={ladosDe(profile.role, profile.profile_hashtags ?? []).acompana}
          />
          <div className="mt-3 space-y-3">
            <InstalarApp />
            <AvisosMovil />
          </div>
        </div>

        <div className="border-t border-border/60 pt-8">
          <h2 className="mb-1 text-sm font-semibold text-destructive">Eliminar cuenta</h2>
          <DeleteAccount />
        </div>

        <div className="border-t border-border/60 pt-8">
          <AppAbout />
        </div>
      </Pagina>

      <SiteFooter className="hidden sm:block" />
      <BottomNav
        pendingCount={pendingCount}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
