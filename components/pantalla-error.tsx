'use client'

import { useEffect } from 'react'
import { CLAVE_RECARGA, esErrorDeVersion, puedeRecargarSola } from '@/lib/error-carga'

/**
 * Lo que se ve cuando una pantalla falla en el navegador.
 *
 * Antes no había nada propio y salía la página por defecto de Next, en inglés
 * («This page couldn't load»), sin título ni idioma. Casi siempre es una
 * pestaña abierta de antes de publicar: en ese caso se recarga sola, una vez.
 */
export function PantallaError({ error }: { error: Error & { digest?: string } }) {
  const deVersion = esErrorDeVersion(error)

  useEffect(() => {
    console.error(error)
    if (!deVersion) return
    try {
      if (!puedeRecargarSola(sessionStorage.getItem(CLAVE_RECARGA), Date.now())) return
      sessionStorage.setItem(CLAVE_RECARGA, String(Date.now()))
    } catch {
      // Sin sessionStorage no hay forma de evitar un bucle: mejor no recargar.
      return
    }
    window.location.reload()
  }, [error, deVersion])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <p className="mb-6 text-xl font-bold tracking-tight">metoo.</p>
      <h1 className="text-lg font-semibold">No se ha podido cargar esta pantalla</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {deVersion
          ? 'metoo se ha actualizado mientras la tenías abierta. Al volver a cargarla debería ir bien.'
          : 'Algo ha fallado. Vuelve a cargarla; si sigue pasando, cuéntanoslo desde Contacto.'}
      </p>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Volver a cargar
        </button>
        {/* <a> y no <Link>: si falla el código de la app, una navegación
            completa es lo único seguro. */}
        <a
          href="/dashboard"
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Ir a Inicio
        </a>
      </div>
    </main>
  )
}
