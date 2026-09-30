import Link from 'next/link'
import { ArrowUpRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/auth/actions'
import { NavLinks } from './nav-links'
import { Logo } from '@/components/logo'
import { HeaderTitle } from '@/components/header-title'
import { getUser } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'baygual91@gmail.com'

/**
 * La cabecera sin nada que esperar.
 *
 * Existe aparte para que los `loading.tsx` puedan pintar la cabecera DE VERDAD
 * mientras la página resuelve sus datos, en vez de una barra gris. El
 * streaming ya entregaba el esqueleto pronto (~136 ms con datos que tardan
 * 1,5 s), pero lo que entregaba no servía de nada: ni logo, ni título, ni
 * forma de salir.
 *
 * Lo único que depende de datos es el enlace de admin, que entra por props.
 */
export function SiteHeaderShell({ adminLink }: { adminLink?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      {/* `relative` para que el título se centre respecto a la barra entera */}
      <div className="relative mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        {/* En móvil solo el isotipo: la barra va justa de espacio */}
        <Link href="/dashboard" className="shrink-0">
          <Logo size={28} wordmarkClassName="sr-only sm:not-sr-only" />
        </Link>

        <HeaderTitle />

        <NavLinks />

        {/*
          Todo lo de la derecha va en un solo grupo. Antes el bloque de
          admin/Normas y el botón de salir eran hermanos sueltos del
          `justify-between`, y en móvil —donde el menú y «Normas» están
          ocultos— eso dejaba el enlace de admin en el centro exacto de la
          barra, pisando el título de la pantalla.
        */}
        <div className="flex items-center gap-2">
          {adminLink}

          <Link
            href="/guidelines"
            target="_blank"
            className="hidden items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:flex"
          >
            Normas <ArrowUpRight className="size-3" />
          </Link>

          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit" className="gap-2">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}

export async function SiteHeader() {
  // getUser() está memoizada por petición: si la página que envuelve a este
  // header ya la llamó, aquí no se repite la validación contra Supabase Auth.
  const user = await getUser()
  const isAdmin = user?.email === ADMIN_EMAIL

  return (
    <SiteHeaderShell
      adminLink={
        isAdmin ? (
          // «DB» en texto, no el engranaje: un engranaje se lee como ajustes
          // de la cuenta, y esto es el panel de administración. Dos letras
          // caben en móvil, que es donde el icono solo no se entendía.
          //
          // Visible también en móvil a propósito: iba con `hidden sm:flex` y
          // desde el teléfono no había forma de llegar al panel salvo
          // escribiendo la URL.
          <Link
            href="/admin"
            className="flex items-center rounded-lg px-2 py-1.5 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30 dark:hover:text-amber-300 sm:px-2.5"
            title="Panel de administración"
            aria-label="Panel de administración"
          >
            DB
          </Link>
        ) : null
      }
    />
  )
}
