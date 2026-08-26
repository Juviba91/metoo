import type { Metadata } from 'next'

// La página es un Client Component ('use client'), así que no puede exportar
// metadata directamente: el título vive en este layout del segmento.
export const metadata: Metadata = { title: 'Entrar' }

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
