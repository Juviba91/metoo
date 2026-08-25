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
  size = 32,
  showWordmark = true,
}: {
  className?: string
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
      {showWordmark && (
        <span className="text-xl font-bold tracking-tight">metoo.</span>
      )}
      <span className="sr-only">metoo</span>
    </span>
  )
}
