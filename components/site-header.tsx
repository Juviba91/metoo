import Link from 'next/link'
import { ArrowUpRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import { NavLinks } from './nav-links'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          metoo.
        </Link>

        <NavLinks />

        <Link
          href="/guidelines"
          target="_blank"
          className="hidden items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
        >
          Normas <ArrowUpRight className="size-3" />
        </Link>

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
