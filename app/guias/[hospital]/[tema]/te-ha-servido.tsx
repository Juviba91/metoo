'use client'

import { useState, useSyncExternalStore } from 'react'
import { votarGuia } from '@/app/guias/actions'

/**
 * Un toque para saber si una guía sirve. El voto se recuerda en este
 * navegador para no preguntar dos veces (y no contar dos veces lo mismo).
 */
export function TeHaServido({ hospitalSlug, temaSlug }: { hospitalSlug: string; temaSlug: string }) {
  const clave = `metoo-voto-${hospitalSlug}-${temaSlug}`
  const [votoAhora, setVotado] = useState<boolean | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Lo votado otro día, leído del navegador (en el servidor no hay: null).
  const guardado = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return localStorage.getItem(clave)
      } catch {
        return null
      }
    },
    () => null,
  )
  const votado = votoAhora ?? (guardado === 'si' ? true : guardado === 'no' ? false : null)

  async function votar(util: boolean) {
    setEnviando(true)
    const res = await votarGuia(hospitalSlug, temaSlug, util)
    setEnviando(false)
    if (res.error) return
    setVotado(util)
    try {
      localStorage.setItem(clave, util ? 'si' : 'no')
    } catch {}
  }

  if (votado !== null) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {votado ? 'Gracias. Se lo diremos a quienes la escribieron.' : 'Gracias. Nos ayuda a mejorarla.'}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
      <span className="text-muted-foreground">¿Te ha servido esta guía?</span>
      {[
        { util: true, texto: 'Sí' },
        { util: false, texto: 'No mucho' },
      ].map((o) => (
        <button
          key={o.texto}
          type="button"
          disabled={enviando}
          onClick={() => votar(o.util)}
          className="rounded-full border border-border px-3 py-1 transition-colors hover:bg-muted disabled:opacity-50"
        >
          {o.texto}
        </button>
      ))}
    </div>
  )
}
