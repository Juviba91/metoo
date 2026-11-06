'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { editarAportacion } from '@/app/dashboard/guias/actions'

const MAX = 600

/**
 * Una respuesta tuya en una guía, con «Editar».
 *
 * Solo se usa en las respuestas de quien está leyendo: el resto son texto
 * plano. La base vuelve a comprobar que sea tuya, así que esto no es una
 * frontera, solo la forma de llegar.
 *
 * `children` es la línea de alias y fecha, que viene ya pintada del servidor.
 */
export function EditarRespuesta({
  id,
  contenido,
  children,
}: {
  id: string
  contenido: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState(contenido)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function abrir() {
    // Se parte de lo que hay publicado ahora, no de una edición anterior
    // cancelada ni de una versión vieja.
    setTexto(contenido)
    setError(null)
    setEditando(true)
  }

  async function guardar() {
    if (texto.trim().length < 10) {
      setError('Escribe algo más: al menos diez caracteres.')
      return
    }
    setGuardando(true)
    setError(null)
    try {
      const res = await editarAportacion(id, texto)
      if (res.error) {
        setError(res.error)
        return
      }
      setEditando(false)
      router.refresh()
    } finally {
      setGuardando(false)
    }
  }

  if (!editando) {
    return (
      <>
        <p className="whitespace-pre-line">{contenido}</p>
        <div className="flex items-end justify-between gap-3">
          {children}
          <button
            type="button"
            onClick={abrir}
            className="shrink-0 text-xs text-primary underline-offset-2 hover:underline"
          >
            Editar
          </button>
        </div>
      </>
    )
  }

  return (
    <div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={MAX}
        rows={5}
        aria-label="Tu respuesta"
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {error ? <span className="text-destructive">{error}</span> : `${texto.length}/${MAX}`}
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditando(false)} disabled={guardando} className="text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={guardar} disabled={guardando || texto.trim().length === 0} className="text-xs">
            {guardando ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
