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
  const totalChats = pendingCount + chatUnread

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
          const showBadge = href === '/dashboard/chats' && totalChats > 0
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <div className="relative">
                <Icon className={`size-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                {showBadge && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {totalChats > 9 ? '9+' : totalChats}
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
