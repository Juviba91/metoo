import { permanentRedirect } from 'next/navigation'

/**
 * Las guías eran /guias/<hospital>/<tema> y ahora son /guias/<tema>.
 *
 * Hay enlaces y carteles con QR ya impresos y repartidos con la dirección
 * antigua, así que se redirige en vez de dejar un 404. El primer segmento
 * (`tema` aquí, por el nombre de la ruta de al lado) es en realidad el
 * hospital, y el segundo (`viejo`) el tema. Se conserva el `?utm_…`.
 */
export default async function GuiaAntigua({
  params,
  searchParams,
}: {
  params: Promise<{ tema: string; viejo: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { viejo: tema } = await params
  const consulta = new URLSearchParams()
  for (const [k, v] of Object.entries(await searchParams)) {
    if (typeof v === 'string') consulta.set(k, v)
  }
  const resto = consulta.toString()
  permanentRedirect(`/guias/${tema}${resto ? `?${resto}` : ''}`)
}
