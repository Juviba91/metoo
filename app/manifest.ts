import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'metoo',
    short_name: 'metoo',
    description: 'Apoyo emocional de personas que han vivido lo mismo',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    orientation: 'portrait',
    // Se apunta a /logo.png (en public/) en vez de a las rutas generadas por
    // app/icon.png, cuya URL lleva un hash que cambia en cada build.
    icons: [
      { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
