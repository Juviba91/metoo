'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { aportar } from './actions'

/** El selector de tema. Va por la URL para que la página siga siendo servidor. */
export function Selectores({
  temas,
  temaSlug,
}: {
  temas: { slug: string; label: string }[]
  temaSlug: string | null
}) {
  const router = useRouter()

  function ir(tema: string | null) {
    router.push(tema ? `/dashboard/guias?tema=${tema}` : '/dashboard/guias')
  }

  const selectClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20'

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">¿Sobre qué tema?</span>
      <select
        value={temaSlug ?? ''}
        onChange={(e) => ir(e.target.value || null)}
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
  )
}

const MAX = 600

/** Una pregunta con su caja. Cada una se guarda por su cuenta. */
export function CajaPregunta({
  temaSlug,
  preguntaId,
  enunciado,
  ayuda,
  yaRespondida,
}: {
  temaSlug: string
  preguntaId: string
  enunciado: string
  ayuda: string | null
  yaRespondida: number
}) {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<'listo' | 'enviando' | 'guardado'>('listo')
  const [error, setError] = useState<string | null>(null)

  async function guardar() {
    if (texto.trim().length < 10) {
      setError('Escribe algo más: al menos diez caracteres.')
      return
    }
    setEstado('enviando')
    setError(null)

    const res = await aportar(temaSlug, preguntaId, texto)

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
