'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, Rss, User } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/chats', label: 'Chats', icon: MessageCircle },
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/dashboard/perfil', label: 'Perfil', icon: User },
]

export function BottomNav({ pendingCount = 0, chatUnread = 0 }: { pendingCount?: number; chatUnread?: number }) {
  const pathname = usePathname()

  /**
   * Cada aviso, en la pestaña donde se resuelve.
   *
   * Antes se sumaban los dos y el total salía sobre Chats. Pero una solicitud
   * de conexión no es un mensaje: se acepta o se rechaza desde Inicio. El globo
   * mandaba a una pestaña donde no había nada que leer y, si no tenías además
   * mensajes sin leer, no había forma de quitarlo desde allí.
   */
  const avisos: Record<string, number> = {
    '/dashboard': pendingCount,
    '/dashboard/chats': chatUnread,
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm sm:hidden">
      <div className="flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            (href === '/dashboard' && pathname === '/dashboard') ||
            (href === '/dashboard/chats' &&
              (pathname.startsWith('/dashboard/chats') || pathname.startsWith('/dashboard/chat/'))) ||
            (href === '/feed' && pathname.startsWith('/feed')) ||
            // /dashboard/perfil/[id] es el perfil de OTRA persona: marcar ahí
            // "Perfil" hacía creer que estabas viendo el tuyo.
            (href === '/dashboard/perfil' &&
              (pathname === '/dashboard/perfil' || pathname === '/dashboard/perfil/blocked'))
          const aviso = avisos[href] ?? 0
          return (
            <Link
              key={href}
              href={href}
              // `true` explícito, no el prefetch por defecto.
              //
              // En rutas dinámicas el prefetch por defecto solo trae el
              // esqueleto del loading.tsx, no el contenido: por eso al medirlo
              // en su día no cambiaba nada y se puso en `false`. Medido nº2, a
              // 140 ms de latencia (España→Virginia) y con la página tardando
              // 250 ms en resolver sus datos:
              //
              //   prefetch={false}      contenido a los 376 ms
              //   prefetch por defecto  contenido a los 370 ms
              //   prefetch={true}       contenido a los  95 ms
              //
              // Cuesta cuatro renders de fondo por carga, pero no retrasan
              // nada: se lanzan después del `load` (619 ms sin, 625 ms con).
              // Estas cuatro rutas son la app entera; es donde toca gastarlo.
              prefetch
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`size-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                {aviso > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {aviso > 9 ? '9+' : aviso}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
