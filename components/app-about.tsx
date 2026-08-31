import Link from 'next/link'
import { Logo } from '@/components/logo'

/**
 * Ficha de la app y avisos legales, al final de Mi perfil.
 *
 * El pie del sitio (SiteFooter) va oculto en móvil en las pantallas de la app
 * porque la barra inferior ocupa ese espacio, así que desde el móvil no había
 * forma de llegar a Privacidad ni a Términos. Este bloque cubre ese hueco.
 */
export function AppAbout() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-5">
        <div className="mb-3 flex items-center gap-3">
          <Logo size={28} showWordmark={false} />
          <div>
            <p className="font-semibold">metoo.</p>
            <p className="text-xs text-muted-foreground">
              Apoyo entre personas que lo han vivido
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Conectamos a quien está pasando por un momento difícil con voluntarios
          que han vivido lo mismo. Nadie aquí es profesional: son personas que
          han estado donde tú estás.
        </p>
      </div>

      <div className="border-t border-border/60 pt-6 text-center">
        <p className="text-xs leading-relaxed text-muted-foreground">
          © 2026 metoo. Todos los derechos reservados. Hecho con cuidado por{' '}
          <a
            href="https://bay-apps.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Bay Apps
          </a>
          .
        </p>
        <div className="mt-3 flex justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/privacidad" className="transition-colors hover:text-foreground">
            Privacidad
          </Link>
          <Link href="/terminos" className="transition-colors hover:text-foreground">
            Términos
          </Link>
          <Link href="/guidelines" className="transition-colors hover:text-foreground">
            Normas
          </Link>
        </div>
      </div>
    </div>
  )
}
