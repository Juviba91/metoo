import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * Marca de metoo: isotipo + wordmark.
 *
 * El isotipo lleva su propio fondo blanco y esquinas redondeadas (es el mismo
 * fichero que el favicon), así que se comporta igual en claro y en oscuro.
 */
export function Logo({
  className,
  wordmarkClassName,
  size = 32,
  showWordmark = true,
}: {
  className?: string
  /** Para ocultar el wordmark por breakpoint sin perder el texto accesible. */
  wordmarkClassName?: string
  size?: number
  showWordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Image
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        priority
        className="rounded-[22%]"
        style={{ width: size, height: size }}
      />
      {showWordmark ? (
        // Para ocultarlo por breakpoint, pasar `sr-only sm:not-sr-only`: sigue
        // siendo accesible aunque no se vea. `hidden` lo sacaría del árbol de
        // accesibilidad y el enlace se quedaría sin nombre.
        <span className={cn('text-xl font-bold tracking-tight', wordmarkClassName)}>
          metoo.
        </span>
      ) : (
        <span className="sr-only">metoo</span>
      )}
    </span>
  )
}
