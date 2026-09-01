import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { ScrollReset } from '@/components/scroll-reset'
import { AppSplash } from '@/components/app-splash'
import './globals.css'

// Geist Mono se descargaba en cada carga (29 KB) y no se usaba en ninguna
// pantalla: la variable --font-mono solo aparecía en su propia definición.
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://metoonetwork.xyz'),
  title: {
    default: 'metoo — Apoyo entre personas que lo han vivido',
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
    title: 'metoo — Apoyo entre personas que lo han vivido',
    description: 'Conectamos a personas que pasan por momentos difíciles con voluntarios que han vivido la misma experiencia.',
    type: 'website',
    locale: 'es_ES',
    siteName: 'metoo',
  },
  twitter: {
    card: 'summary',
    title: 'metoo — Apoyo entre personas que lo han vivido',
    description: 'Conectamos a personas que pasan por momentos difíciles con voluntarios que han vivido la misma experiencia.',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
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
        <AppSplash />
        <ScrollReset />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
