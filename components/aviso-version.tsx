'use client'

import { useEffect, useState } from 'react'

/** Lo que dice Next cuando el botón pertenece a una versión ya retirada. */
export function esAccionDeVersionVieja(motivo: unknown): boolean {
  const texto = motivo instanceof Error ? motivo.message : String(motivo ?? '')
  return /Failed to find Server Action|older or newer deployment/i.test(texto)
}

/**
 * Si publicamos mientras alguien tiene la app abierta, sus botones apuntan a
 * acciones del servidor que ya no existen y no hacen nada (era el único error
 * de producción: «Failed to find Server Action»). En vez de un botón muerto,
 * se le ofrece recargar.
 */
export function AvisoVersion() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function alRechazo(e: PromiseRejectionEvent) {
      if (esAccionDeVersionVieja(e.reason)) setVisible(true)
    }
    function alError(e: ErrorEvent) {
      if (esAccionDeVersionVieja(e.error ?? e.message)) setVisible(true)
    }
    window.addEventListener('unhandledrejection', alRechazo)
    window.addEventListener('error', alError)
    return () => {
      window.removeEventListener('unhandledrejection', alRechazo)
      window.removeEventListener('error', alError)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl bg-foreground px-4 py-3 text-sm text-background shadow-lg sm:bottom-6"
    >
      <span>Hay una versión nueva de metoo.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="shrink-0 rounded-lg bg-background px-3 py-1.5 text-xs font-medium text-foreground"
      >
        Recargar
      </button>
    </div>
  )
}
