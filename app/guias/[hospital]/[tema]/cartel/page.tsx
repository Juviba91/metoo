import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { URL_SITIO } from '@/lib/sitio'
import { TITULAR } from '@/lib/titular'
import { qrSvg } from '@/lib/qr'
import { Imprimir } from './imprimir'
import type { Metadata } from 'next'

type Params = Promise<{ hospital: string; tema: string }>
type Busqueda = Promise<{ formato?: string }>

export const metadata: Metadata = {
  title: 'Cartel',
  robots: { index: false, follow: false },
}

/**
 * Un cartel para imprimir (A4) o una hoja de tarjetas, con un QR a la guía.
 *
 * Las guías ya no se indexan (nota legal, U-3), así que no llegan por Google:
 * tienen que llegar en papel, a la sala de familias del hospital, que es donde
 * está quien las necesita. El QR lleva `utm_source=cartel` para saber en las
 * analíticas cuántas visitas vienen de ahí.
 */
export default async function CartelPage({ params, searchParams }: { params: Params; searchParams: Busqueda }) {
  const { hospital: hospitalSlug, tema: temaSlug } = await params
  const { formato } = await searchParams
  const tarjetas = formato === 'tarjetas'

  const supabase = await createClient()
  const { data } = await supabase
    .from('guias_indice')
    .select('hospital, ciudad, tema')
    .eq('hospital_slug', hospitalSlug)
    .eq('tema_slug', temaSlug)
    .maybeSingle()

  if (!data) notFound()

  const enlace = `${URL_SITIO}/guias/${hospitalSlug}/${temaSlug}?utm_source=${tarjetas ? 'tarjeta' : 'cartel'}&utm_medium=qr`
  const svg = await qrSvg(enlace)
  const corto = `metoonetwork.xyz/guias/${hospitalSlug}/${temaSlug}`

  return (
    <div className="min-h-screen bg-white text-black">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print { .no-imprimir { display: none !important; } body { background: white; } }
      `}</style>

      <div className="no-imprimir mx-auto flex max-w-[190mm] flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm">
        <p className="text-neutral-600">
          {tarjetas ? 'Ocho tarjetas por hoja, para recortar.' : 'Cartel A4.'}{' '}
          <a
            href={tarjetas ? '?' : '?formato=tarjetas'}
            className="underline underline-offset-2"
          >
            {tarjetas ? 'Ver el cartel' : 'Ver tarjetas'}
          </a>
        </p>
        <Imprimir />
      </div>

      {tarjetas ? (
        <div className="mx-auto grid max-w-[190mm] grid-cols-2 gap-0 border border-dashed border-neutral-300">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="flex h-[66mm] items-center gap-4 border border-dashed border-neutral-300 p-4"
            >
              <div className="size-[34mm] shrink-0" dangerouslySetInnerHTML={{ __html: svg }} />
              <div className="min-w-0">
                <p className="text-[11pt] font-bold leading-tight">{data.tema}</p>
                <p className="text-[9pt] leading-tight">{data.hospital}</p>
                <p className="mt-2 text-[8.5pt] leading-snug text-neutral-700">
                  Lo práctico que otras familias aprendieron aquí. Y alguien que lo vivió con
                  quien hablar.
                </p>
                <p className="mt-2 text-[8pt] font-semibold">metoo.</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto flex min-h-[260mm] max-w-[186mm] flex-col items-center justify-between px-6 py-10 text-center">
          <div>
            <p className="text-[14pt] uppercase tracking-widest text-neutral-500">{data.hospital}</p>
            {/* El tema va tal cual: son etiquetas con siglas («UCI»), y pasarlas
                a minúsculas para meterlas en una frase las estropea. */}
            <h1 className="mt-4 text-[38pt] font-bold leading-tight">{data.tema}</h1>
            <p className="mx-auto mt-6 max-w-[140mm] text-[15pt] leading-snug text-neutral-700">
              Otras familias que estuvieron aquí cuentan lo práctico que nadie te explica:
              dónde dormir, horarios, trámites, qué traer.
            </p>
          </div>

          <div className="my-8">
            <div className="mx-auto size-[80mm]" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="mt-3 text-[11pt] text-neutral-600">{corto}</p>
          </div>

          <div>
            <p className="text-[14pt] leading-snug">
              Y si quieres hablar con alguien que ya lo vivió, en metoo hay personas que te
              pueden acompañar. Gratis y sin dar tu nombre.
            </p>
            <p className="mt-8 text-[22pt] font-bold">metoo.</p>
            <p className="mt-2 text-[9pt] text-neutral-500">
              Lo escriben familias, no el hospital. No es información médica. {TITULAR.corto}, sin
              ánimo de lucro.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
