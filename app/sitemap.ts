import type { MetadataRoute } from 'next'
import { URL_SITIO } from '@/lib/sitio'

/**
 * Lo que se ofrece a los buscadores.
 *
 * Las guías de cada hospital estuvieron aquí y ya no: la nota legal de octubre
 * de 2026 (medida U-3) pide que no se indexen, porque un hospital, un tema de
 * salud y el momento en que alguien lo cuenta pueden bastar para reconocer a
 * una persona. Siguen siendo públicas —se enlazan desde /guias— pero llevan
 * `noindex`. El índice de /guias sí está: solo dice qué hospitales y temas
 * tienen algo escrito.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${URL_SITIO}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${URL_SITIO}/guias`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${URL_SITIO}/guidelines`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${URL_SITIO}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${URL_SITIO}/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${URL_SITIO}/contacto`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
