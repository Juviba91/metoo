import { Analytics } from '@vercel/analytics/next'
import { AvisoVersion } from '@/components/aviso-version'
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ScrollReset } from '@/components/scroll-reset'
import { AppSplash } from '@/components/app-splash'
import { URL_SITIO } from '@/lib/sitio'
import './globals.css'

// Geist Mono se descargaba en cada carga (29 KB) y no se usaba en ninguna
// pantalla: la variable --font-mono solo aparecía en su propia definición.
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: 'metoo — Alguien ya estuvo donde estás tú',
    template: '%s · metoo',
  },
  description: 'Conectamos a personas que pasan por momentos difíciles con voluntarios que han vivido la misma experiencia.',
  generator: 'next',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'metoo',
  },
  openGraph: {
    title: 'metoo — Alguien ya estuvo donde estás tú',
    description: 'Conectamos a personas que pasan por momentos difíciles con voluntarios que han vivido la misma experiencia.',
    type: 'website',
    locale: 'es_ES',
    siteName: 'metoo',
  },
  twitter: {
    card: 'summary',
    title: 'metoo — Alguien ya estuvo donde estás tú',
    description: 'Conectamos a personas que pasan por momentos difíciles con voluntarios que han vivido la misma experiencia.',
  },
}

export const viewport: Viewport = {
  // Solo claro, que es lo que la app es: ningún código activa el modo oscuro
  // (la clase `dark` no se pone en ningún sitio). Con `light dark` y un color
  // de barra negro para el oscuro, quien tenía el móvil en oscuro veía la
  // barra del navegador negra encima de una página blanca.
  colorScheme: 'light',
  // El terracota de metoo (--primary), también en la barra del navegador y en
  // la de la app instalada.
  themeColor: '#a85a34',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={geistSans.variable}>
      <body className="font-sans antialiased">
        {/* Chrome ofrece instalar la app con un evento que lanza una sola vez al
            cargar, en la página que sea. Se guarda aquí para que el botón de
            Ajustes pueda usarlo después. No se cancela: el aviso propio de
            Chrome sigue saliendo. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "addEventListener('beforeinstallprompt',function(e){window.__metooInstalar=e})",
          }}
        />
        <AppSplash />
        <ScrollReset />
        {children}
        <AvisoVersion />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
