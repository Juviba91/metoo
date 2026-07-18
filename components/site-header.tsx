'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageCircle, Rss, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: Home },
  { href: '/dashboard/chats', label: 'Chats', icon: MessageCircle },
  { href: '/feed', label: 'Feed', icon: Rss },
  { href: '/dashboard/perfil', label: 'Perfil', icon: User },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          metoo.
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {navItems.map(({ href, label }) => {
            const active =
              (href === '/dashboard' && pathname === '/dashboard') ||
              (href === '/dashboard/chats' &&
                (pathname.startsWith('/dashboard/chats') ||
                  pathname.startsWith('/dashboard/chat/'))) ||
              (href === '/feed' && pathname.startsWith('/feed')) ||
              (href === '/dashboard/perfil' && pathname.startsWith('/dashboard/perfil'))
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit" className="gap-2">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
