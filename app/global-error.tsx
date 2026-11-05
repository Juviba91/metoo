'use client'

import './globals.css'
import { PantallaError } from '@/components/pantalla-error'

// Si falla el propio layout raíz, esto lo sustituye entero: por eso lleva su
// <html lang>, su <title> y los estilos. Sin él salía la página de Next en
// inglés, sin título ni idioma (lo que marcaba el panel de accesibilidad).
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        <title>No se ha podido cargar · metoo</title>
        <PantallaError error={error} />
      </body>
    </html>
  )
}
