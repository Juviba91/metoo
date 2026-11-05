'use client'

import { PantallaError } from '@/components/pantalla-error'

// Fallos dentro de una pantalla: se pintan dentro del layout raíz, que ya
// pone el idioma y los estilos.
export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <>
      <title>No se ha podido cargar · metoo</title>
      <PantallaError error={error} />
    </>
  )
}
