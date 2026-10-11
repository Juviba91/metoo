import type { MetadataRoute } from 'next'
import { URL_SITIO } from '@/lib/sitio'

/**
 * Lo público es la portada, las guías y los textos legales. Todo lo demás pide
 * sesión: si el buscador entra ahí solo encuentra la pantalla de acceso.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/auth', '/onboarding', '/feed', '/temas', '/baja'],
    },
    sitemap: `${URL_SITIO}/sitemap.xml`,
  }
}
