import Link from 'next/link'
import { ArrowUpRight, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import { NavLinks } from './nav-links'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'baygual91@gmail.com'

export async function SiteHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.email === ADMIN_EMAIL

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          metoo.
        </Link>

        <NavLinks />

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30 dark:hover:text-amber-300 sm:flex"
              title="Admin Panel"
            >
              <Settings className="size-4" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          )}

          <Link
            href="/guidelines"
            target="_blank"
            className="hidden items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
          >
            Normas <ArrowUpRight className="size-3" />
          </Link>
        </div>

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
