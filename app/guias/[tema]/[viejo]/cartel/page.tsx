import { permanentRedirect } from 'next/navigation'

/** El cartel de /guias/<hospital>/<tema>/cartel pasa a /guias/<tema>/cartel. */
export default async function CartelAntiguo({
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
  permanentRedirect(`/guias/${tema}/cartel${resto ? `?${resto}` : ''}`)
}
