import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { BookOpen } from 'lucide-react'

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
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Acceso directo a las guías desde cualquier página pública: es lo
              único de metoo que sirve sin cuenta, en el minuto uno. */}
          <Link href="/guias" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5')}>
            <BookOpen className="size-4" />
            Guías
          </Link>
          {showAuth ? (
            <>
              {/* Los dos van a la misma pantalla («Entra o crea tu cuenta»). En
                  el móvil no caben con «Guías» al lado: queda uno solo. */}
              <Link
                href="/auth/login"
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}
              >
                Entrar
              </Link>
              <Link href="/auth/login" className={cn(buttonVariants({ size: 'sm' }))}>
                <span className="sm:hidden">Entrar</span>
                <span className="hidden sm:inline">Crear cuenta</span>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
