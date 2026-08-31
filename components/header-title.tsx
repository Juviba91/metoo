'use client'

import { usePathname } from 'next/navigation'

/**
 * Título de la pantalla actual, dentro de la cabecera.
 *
 * Solo se muestra en móvil: en escritorio ya está NavLinks marcando la pestaña
 * activa, y dos indicadores de lo mismo sobran. Las pantallas esconden su
 * propio título en móvil (`hidden sm:block`) para que no salga duplicado.
 *
 * Se resuelve por la ruta en vez de pasarlo por props desde cada página: así
 * no hay que acordarse de enviarlo al añadir una pantalla nueva, y la cabecera
 * sigue siendo un server component salvo esta pieza.
 */
const TITLES: [test: (p: string) => boolean, title: string][] = [
  [(p) => p === '/dashboard', '🏠 Inicio'],
  [(p) => p.startsWith('/dashboard/chats'), '💬 Chats'],
  [(p) => p.startsWith('/dashboard/chat/'), '💬 Chat'],
  [(p) => p.startsWith('/feed'), '📝 Feed'],
  [(p) => p === '/dashboard/perfil/blocked', '🚫 Bloqueados'],
  [(p) => p === '/dashboard/perfil', '👤 Mi perfil'],
  [(p) => p.startsWith('/dashboard/perfil/'), '👤 Perfil'],
]

export function HeaderTitle() {
  const pathname = usePathname()
  const title = TITLES.find(([test]) => test(pathname))?.[1]

  if (!title) return null

  return (
    <span className="truncate text-sm font-semibold sm:hidden">{title}</span>
  )
}
