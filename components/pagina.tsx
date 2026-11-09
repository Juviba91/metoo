import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * El marco de cada pantalla: ancho, márgenes y hueco para la barra de abajo.
 *
 * Antes cada página escribía el suyo a mano y había 20 combinaciones
 * distintas: unas empezaban a 24 px de la cabecera y otras a 32, unas dejaban
 * 96 px abajo y otras 144 sin tener nada que esquivar. Con esto todas
 * respiran igual y, si hay que cambiar algo, se cambia aquí.
 */
const ANCHOS = {
  /** Formularios y ajustes: una columna que se lee de un vistazo. */
  estrecho: 'max-w-lg',
  /** Lectura: perfil, feed, guías. */
  normal: 'max-w-2xl',
  /** Rejillas de tarjetas: Inicio, chats, temas. */
  ancho: 'max-w-4xl',
  /** Tablas del panel de admin. */
  completo: 'max-w-6xl',
} as const

/**
 * Lo que hay que dejar libre abajo en el móvil.
 * - `barra`: la barra de pestañas (~64 px más la zona segura).
 * - `burbuja`: la barra y, encima, la burbuja de opinión.
 * - `nada`: pantallas sin barra (admin, consentimiento).
 */
const ABAJO = {
  barra: 'pb-24',
  burbuja: 'pb-36',
  nada: 'pb-8',
} as const

export function Pagina({
  ancho = 'normal',
  abajo = 'barra',
  className,
  children,
}: {
  ancho?: keyof typeof ANCHOS
  abajo?: keyof typeof ABAJO
  className?: string
  children: React.ReactNode
}) {
  return (
    <main
      className={cn(
        'mx-auto w-full flex-1 space-y-8 px-4 pt-6 sm:px-6 sm:py-8',
        ANCHOS[ancho],
        ABAJO[abajo],
        className,
      )}
    >
      {children}
    </main>
  )
}

/**
 * Título y subtítulo de la pantalla.
 *
 * En el móvil el título ya sale centrado en la cabecera (`HeaderTitle`), así
 * que aquí se oculta a la vista, pero no a los lectores de pantalla: con
 * `hidden` la página se quedaba sin encabezado principal.
 */
export function CabeceraPagina({
  titulo,
  siempreVisible = false,
  children,
}: {
  titulo: React.ReactNode
  /** Para las páginas sin cabecera de app (sin sesión), donde nadie más lo dice. */
  siempreVisible?: boolean
  /** El subtítulo: una o dos frases de qué es esto. */
  children?: React.ReactNode
}) {
  return (
    <div>
      <h1 className={cn('text-2xl font-bold', !siempreVisible && 'sr-only sm:not-sr-only')}>{titulo}</h1>
      {children && (
        <p className={cn('text-sm leading-relaxed text-muted-foreground', siempreVisible ? 'mt-1' : 'sm:mt-1')}>
          {children}
        </p>
      )}
    </div>
  )
}

/** El «← Algo» de arriba, igual en todas las pantallas que lo llevan. */
export function Volver({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> {children}
    </Link>
  )
}
