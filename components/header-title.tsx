'use client'

import { usePathname } from 'next/navigation'

/**
 * Título de la pantalla actual, centrado en la cabecera.
 *
 * Solo se muestra en móvil: en escritorio ya está NavLinks marcando la pestaña
 * activa, y dos indicadores de lo mismo sobran. Las pantallas esconden su
 * propio título en móvil (`hidden sm:block`) para que no salga duplicado.
 *
 * Va posicionado en absoluto para quedar centrado respecto a la cabecera
 * entera, no respecto al hueco que dejan el logo y el botón de salir (que
 * miden distinto y lo descuadrarían). `pointer-events-none` deja que se pueda
 * pulsar el logo aunque el contenedor se solape con él.
 */
const TITLES: [test: (p: string) => boolean, title: string][] = [
  [(p) => p === '/dashboard', 'Inicio'],
  [(p) => p.startsWith('/dashboard/chats'), 'Chats'],
  [(p) => p.startsWith('/dashboard/chat/'), 'Chat'],
  [(p) => p.startsWith('/feed'), 'Feed'],
  [(p) => p === '/dashboard/perfil/blocked', 'Bloqueados'],
  [(p) => p === '/dashboard/perfil', 'Mi perfil'],
  [(p) => p.startsWith('/dashboard/perfil/'), 'Perfil'],
]

export function HeaderTitle() {
  const pathname = usePathname()
  const title = TITLES.find(([test]) => test(pathname))?.[1]

  if (!title) return null

  return (
    <span
      data-header-title
      className="pointer-events-none absolute left-1/2 max-w-[45%] -translate-x-1/2 truncate text-sm font-semibold sm:hidden"
    >
      {title}
    </span>
  )
}
