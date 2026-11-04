'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { LIMITE_MENSAJE_EQUIPO } from '@/lib/equipo'

/**
 * Caja para escribir al equipo. `enviar` es la acción de cada lado (la persona o
 * el panel de admin); aquí solo vive el estado del formulario.
 */
export function FormularioEquipo({
  enviar,
  placeholder = 'Escribe al equipo…',
}: {
  enviar: (contenido: string) => Promise<{ success?: boolean; error?: string }>
  placeholder?: string
}) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function alEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    setError(null)
    const res = await enviar(texto)
    setEnviando(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setTexto('')
    router.refresh()
  }

  return (
    <form onSubmit={alEnviar} className="space-y-2">
      <div className="flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          rows={3}
          maxLength={LIMITE_MENSAJE_EQUIPO}
          className="min-h-20 w-full resize-none rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm leading-snug outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
        <button
          type="submit"
          disabled={!texto.trim() || enviando}
          aria-label="Enviar"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
