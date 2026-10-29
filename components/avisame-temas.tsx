'use client'

import { useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { pedirAvisoTema, quitarAvisoTema } from '@/app/dashboard/actions'

type Tema = { id: string; label: string }

/**
 * Los temas en los que buscas apoyo y aún no acompaña nadie, con la opción de
 * que te avisemos por correo cuando llegue alguien.
 *
 * Antes la lista de voluntarios salía sin nadie de lo tuyo y no había nada
 * que hacer salvo irse. Va encima de la lista, porque es lo primero que
 * necesitas saber.
 */
export function AvisameTemas({ temas, pedidos }: { temas: Tema[]; pedidos: string[] }) {
  const [activos, setActivos] = useState<Set<string>>(new Set(pedidos))
  const [prevPedidos, setPrevPedidos] = useState(pedidos)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Tras revalidar, la lista del servidor manda (ver CLAUDE.md, useState(props)).
  if (prevPedidos !== pedidos) {
    setPrevPedidos(pedidos)
    setActivos(new Set(pedidos))
  }

  if (temas.length === 0) return null

  async function alternar(id: string) {
    setOcupado(id)
    setError(null)
    const pedido = activos.has(id)
    const res = pedido ? await quitarAvisoTema(id) : await pedirAvisoTema(id)
    setOcupado(null)
    if (res.error) {
      setError(res.error)
      return
    }
    setActivos((prev) => {
      const next = new Set(prev)
      if (pedido) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold">
        {temas.length === 1
          ? 'Todavía no hay nadie que acompañe en este tema'
          : 'Todavía no hay nadie que acompañe en estos temas'}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        metoo está empezando. Si quieres, te escribimos en cuanto llegue alguien que lo haya
        vivido.
      </p>
      <ul className="mt-3 space-y-2">
        {temas.map((tema) => {
          const pedido = activos.has(tema.id)
          return (
            <li key={tema.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm">#{tema.label}</span>
              <button
                type="button"
                onClick={() => alternar(tema.id)}
                disabled={ocupado === tema.id}
                aria-pressed={pedido}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  pedido
                    ? 'border-border text-muted-foreground hover:text-foreground'
                    : 'border-foreground bg-foreground text-background hover:opacity-90'
                }`}
              >
                {ocupado === tema.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : pedido ? (
                  <BellOff className="size-3.5" />
                ) : (
                  <Bell className="size-3.5" />
                )}
                {pedido ? 'Te avisaremos · quitar' : 'Avísame'}
              </button>
            </li>
          )
        })}
      </ul>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
