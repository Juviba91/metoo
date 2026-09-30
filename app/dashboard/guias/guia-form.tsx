'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { aportar, quitarMiFirma } from './actions'

/** Los dos selectores. Van por la URL para que la página siga siendo servidor. */
export function Selectores({
  hospitales,
  temas,
  hospitalSlug,
  temaSlug,
}: {
  hospitales: { slug: string; name: string; city: string }[]
  temas: { slug: string; label: string }[]
  hospitalSlug: string | null
  temaSlug: string | null
}) {
  const router = useRouter()

  function ir(hospital: string | null, tema: string | null) {
    const params = new URLSearchParams()
    if (hospital) params.set('hospital', hospital)
    if (tema) params.set('tema', tema)
    router.push(`/dashboard/guias?${params}`)
  }

  const selectClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20'

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Hospital</span>
        <select
          value={hospitalSlug ?? ''}
          onChange={(e) => ir(e.target.value || null, temaSlug)}
          className={selectClass}
        >
          <option value="">Elige un hospital…</option>
          {hospitales.map((h) => (
            <option key={h.slug} value={h.slug}>
              {h.name} ({h.city})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Tema</span>
        <select
          value={temaSlug ?? ''}
          onChange={(e) => ir(hospitalSlug, e.target.value || null)}
          className={selectClass}
        >
          <option value="">Elige un tema…</option>
          {temas.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.label}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted-foreground">
          Los de tu perfil salen primero. Escribe de lo que hayas vivido.
        </span>
      </label>
    </div>
  )
}

const MAX = 600

/** Una pregunta con su caja. Cada una se guarda por su cuenta. */
export function CajaPregunta({
  hospitalSlug,
  temaSlug,
  preguntaId,
  enunciado,
  ayuda,
  yaRespondida,
  alias,
}: {
  hospitalSlug: string
  temaSlug: string
  preguntaId: string
  enunciado: string
  ayuda: string | null
  yaRespondida: number
  /** El alias de quien escribe, para poder enseñárselo en la casilla. */
  alias: string
}) {
  const [texto, setTexto] = useState('')
  const [firmar, setFirmar] = useState(false)
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'guardado'>('listo')
  const [error, setError] = useState<string | null>(null)

  async function guardar() {
    if (texto.trim().length < 10) {
      setError('Escribe algo más: al menos diez caracteres.')
      return
    }
    setEstado('enviando')
    setError(null)

    const res = await aportar(hospitalSlug, temaSlug, preguntaId, texto, firmar)

    if (res.error) {
      setError(res.error)
      setEstado('listo')
      return
    }

    setTexto('')
    setEstado('guardado')
  }

  return (
    <section className="rounded-xl border border-border p-4">
      <h2 className="font-semibold">{enunciado}</h2>
      {ayuda && <p className="mt-0.5 text-sm text-muted-foreground">{ayuda}</p>}
      {yaRespondida > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {yaRespondida === 1
            ? 'Ya hay 1 respuesta. La tuya se suma, no la sustituye.'
            : `Ya hay ${yaRespondida} respuestas. La tuya se suma, no las sustituye.`}
        </p>
      )}

      <textarea
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          if (estado === 'guardado') setEstado('listo')
        }}
        maxLength={MAX}
        rows={3}
        placeholder="Dos o tres líneas bastan…"
        className="mt-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />

      {/* Desmarcada por defecto, y con el alias a la vista: "mostrar mi alias"
          en abstracto no se lee igual que ver el tuyo escrito ahí. Y se dice
          dónde va a acabar, porque estas páginas salen en Google. */}
      <label className="mt-2 flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={firmar}
          onChange={(e) => setFirmar(e.target.checked)}
          className="mt-0.5 size-3.5 shrink-0 accent-foreground"
        />
        <span className="text-xs leading-relaxed text-muted-foreground">
          Firmar como <strong className="font-medium text-foreground">{alias}</strong>
          {firmar ? (
            <span className="text-amber-700 dark:text-amber-500">
              {' '}— tu alias se verá en la página pública, que sale en Google
            </span>
          ) : (
            <span> — si no lo marcas, no aparece tu alias en ningún sitio</span>
          )}
        </span>
      </label>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {estado === 'guardado' ? (
            <span className="font-medium text-green-600">Guardado. Gracias.</span>
          ) : error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            `${texto.length}/${MAX}`
          )}
        </p>
        <Button
          size="sm"
          onClick={guardar}
          disabled={estado === 'enviando' || texto.trim().length === 0}
          className="shrink-0 text-xs"
        >
          {estado === 'enviando' ? 'Guardando…' : 'Añadir'}
        </Button>
      </div>
    </section>
  )
}

/**
 * Retirar la firma de todo lo escrito, de un clic.
 *
 * Es la pieza que hace aceptable que la firma vaya por casilla: si alguien la
 * marcó sin pensarlo, tiene que poder deshacerlo sin escribir a nadie.
 */
export function QuitarFirma() {
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'hecho'>('listo')
  const [quitadas, setQuitadas] = useState(0)

  async function quitar() {
    setEstado('enviando')
    const res = await quitarMiFirma()
    if (res.error) {
      setEstado('listo')
      return
    }
    setQuitadas(res.quitadas ?? 0)
    setEstado('hecho')
  }

  if (estado === 'hecho') {
    return (
      <p className="text-xs text-muted-foreground">
        {quitadas === 0
          ? 'No tenías ninguna aportación firmada.'
          : quitadas === 1
            ? 'Quitada la firma de 1 aportación.'
            : `Quitada la firma de ${quitadas} aportaciones.`}
      </p>
    )
  }

  return (
    <button
      onClick={quitar}
      disabled={estado === 'enviando'}
      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
    >
      {estado === 'enviando'
        ? 'Quitando…'
        : 'Quitar mi alias de todo lo que he escrito en las guías'}
    </button>
  )
}
