import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

interface SiteHeaderPublicProps {
  showAuth?: boolean
  rightContent?: React.ReactNode
}

/**
 * Cabecera para páginas públicas (sin autenticación).
 * Consistente con SiteHeader pero sin elementos que requieran usuario.
 */
export function SiteHeaderPublic({ showAuth = true, rightContent }: SiteHeaderPublicProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 px-6 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <Link href="/">
          <Logo size={28} />
        </Link>
        {rightContent ? (
          rightContent
        ) : showAuth ? (
          <div className="flex gap-2">
            <Link href="/auth/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Entrar
            </Link>
            <Link
              href="/auth/login?tab=register"
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              Crear cuenta
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  )
}
