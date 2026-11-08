'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { borrarAportacion, editarAportacion } from '@/app/dashboard/guias/actions'

const MAX = 600

/**
 * Una respuesta tuya en una guía, con «Editar» y «Borrar».
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
  // Borrar no tiene vuelta atrás: se pide confirmar en el sitio, sin ventana.
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false)
  const [borrando, setBorrando] = useState(false)
  // Hasta que llega la página nueva sin ella, que no siga ahí la pregunta.
  const [borrada, setBorrada] = useState(false)

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

  async function borrar() {
    setBorrando(true)
    setError(null)
    try {
      const res = await borrarAportacion(id)
      if (res.error) {
        setError(res.error)
        return
      }
      setBorrada(true)
      router.refresh()
    } finally {
      setBorrando(false)
    }
  }

  if (borrada) {
    return <p className="text-xs text-muted-foreground">Respuesta borrada.</p>
  }

  if (!editando) {
    return (
      <>
        <p className="whitespace-pre-line">{contenido}</p>
        <div className="flex items-end justify-between gap-3">
          {children}
          {!confirmandoBorrar && (
            <span className="flex shrink-0 gap-3">
              <button
                type="button"
                onClick={abrir}
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoBorrar(true)}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
              >
                Borrar
              </button>
            </span>
          )}
        </div>
        {confirmandoBorrar && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-xs text-foreground">¿Borrar esta respuesta? No se puede deshacer.</p>
            <span className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmandoBorrar(false)}
                disabled={borrando}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button size="sm" variant="destructive" onClick={borrar} disabled={borrando} className="text-xs">
                {borrando ? 'Borrando…' : 'Sí, borrar'}
              </Button>
            </span>
          </div>
        )}
        {error && !editando && <p className="mt-2 text-xs text-destructive">{error}</p>}
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
