'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Inicio' },
  { href: '/dashboard/chats', label: 'Chats' },
  { href: '/feed', label: 'Feed' },
  { href: '/dashboard/perfil', label: 'Perfil' },
]

function isActive(href: string, pathname: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  if (href === '/dashboard/chats') return pathname.startsWith('/dashboard/chats') || pathname.startsWith('/dashboard/chat/')
  return pathname.startsWith(href)
}

export function NavLinks() {
  const pathname = usePathname()
  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            isActive(href, pathname)
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
