import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

interface SiteHeaderPublicProps {
  showAuth?: boolean
  /** El mismo ancho que el contenido de debajo, o el logo queda descuadrado. */
  ancho?: string
}

/**
 * La cabecera de las páginas que se leen sin cuenta. Mismas medidas que
 * SiteHeader (el margen va dentro del contenedor) para que el logo quede en
 * la misma vertical que el contenido.
 */
export function SiteHeaderPublic({ showAuth = true, ancho = 'max-w-4xl' }: SiteHeaderPublicProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className={`mx-auto flex ${ancho} items-center justify-between px-6 py-3`}>
        <Link href="/">
          <Logo size={28} />
        </Link>
        {showAuth ? (
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
