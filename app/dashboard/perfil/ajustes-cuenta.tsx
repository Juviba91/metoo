'use client'

import { useState } from 'react'
import { ChevronDown, Settings } from 'lucide-react'

/**
 * Los ajustes de la cuenta, recogidos.
 *
 * El perfil mezclaba dos cosas muy distintas: lo que editas de verdad —alias,
 * ciudad, bio, etiquetas— y todo lo demás (correo, avisos, eliminar la cuenta,
 * sobre metoo), que se abre una vez cada muchos meses y ocupaba media pantalla
 * de scroll cada día.
 *
 * Cerrado por defecto. Se abre con el icono, y los hijos llegan del servidor:
 * este componente solo pone y quita el `hidden`, no sabe qué hay dentro.
 */
export function AjustesCuenta({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="mt-12 border-t border-border/60 pt-6">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-sm font-semibold transition-colors hover:text-foreground"
      >
        <Settings className="size-4 shrink-0 text-muted-foreground" />
        <span>Ajustes de la cuenta</span>
        <ChevronDown
          className={`ml-auto size-4 shrink-0 text-muted-foreground transition-transform ${
            abierto ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div hidden={!abierto} className="mt-4 space-y-8">
        {children}
      </div>
    </div>
  )
}
