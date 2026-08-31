import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ScrollReset } from '@/components/scroll-reset'
import { AppSplash } from '@/components/app-splash'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  // Sin esto, Next resuelve las imágenes de OG/Twitter contra localhost:3000
  // (avisa de ello en cada build) en vez de contra el dominio real.
  metadataBase: new URL('https://support-network-app.vercel.app'),
  title: {
    default: 'metoo — Apoyo entre personas que lo han vivido',
    // Cada página hija solo pone su nombre corto (p.ej. 'Chats') y esta
    // plantilla arma el título de la pestaña. Antes ninguna página excepto
    // /guidelines ponía título propio, así que todas las pestañas se veían
    // igual y no había forma de distinguirlas.
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
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AppSplash />
        <ScrollReset />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
