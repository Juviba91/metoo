import { createClient, getUser } from '@/lib/supabase/server'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import { SiteHeader } from '@/components/site-header'
import { SiteHeaderPublic } from '@/components/site-header-public'
import { SiteFooter } from '@/components/site-footer'
import { BottomNav } from '@/components/bottom-nav'

/**
 * El marco de las páginas de guías.
 *
 * Son públicas para que se puedan abrir sin cuenta desde un enlace reenviado,
 * pero quien entra con sesión está dentro de la app: con la cabecera pública
 * perdía las pestañas y la barra inferior, y parecía otra web.
 */
export async function GuiasShell({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeaderPublic />
        {children}
        <SiteFooter />
      </div>
    )
  }

  const supabase = await createClient()
  const [pendingCount, { data: unreadData }] = await Promise.all([
    contarSolicitudesPendientes(),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
  ])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      {children}
      <SiteFooter className="hidden sm:block" />
      <BottomNav pendingCount={pendingCount} chatUnread={(unreadData as number) ?? 0} />
    </div>
  )
}
