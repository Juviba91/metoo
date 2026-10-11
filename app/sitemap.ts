import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { URL_SITIO } from '@/lib/sitio'

// Se genera en cada petición y no al compilar: una guía nueva tiene que
// aparecer sin esperar a un despliegue, y la base no está disponible al
// construir.
export const dynamic = 'force-dynamic'

/**
 * Sin esto, las guías no las encontraba nadie desde fuera: ni la portada ni el
 * pie las enlazaban, y Google no tenía por dónde llegar. Solo salen las que
 * tienen algo escrito (`guias_indice`), igual que en /guias.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('guias_indice')
    .select('hospital_slug, tema_slug, ultima')

  const guias = (data ?? []).map((g) => ({
    url: `${URL_SITIO}/guias/${g.hospital_slug}/${g.tema_slug}`,
    lastModified: g.ultima,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: `${URL_SITIO}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${URL_SITIO}/guias`, changeFrequency: 'weekly', priority: 0.9 },
    ...guias,
    { url: `${URL_SITIO}/guidelines`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${URL_SITIO}/privacidad`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${URL_SITIO}/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${URL_SITIO}/contacto`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
