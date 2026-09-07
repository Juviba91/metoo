'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { deleteAccount } from '@/app/auth/actions'
import { AlertTriangle } from 'lucide-react'

/** Lo que hay que escribir para confirmar. */
const CONFIRMACION = 'BORRAR'

/**
 * Borrado de cuenta en dos pasos.
 *
 * Se pide escribir una palabra a pesar de que en el resto de la app se evita
 * el texto libre: aquí la fricción es justo lo que se busca. Es irreversible,
 * y mucha gente abre esto de madrugada y agotada.
 */
export function DeleteAccount() {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const puedeBorrar = texto.trim().toUpperCase() === CONFIRMACION

  async function handleBorrar() {
    if (!puedeBorrar) return
    setEnviando(true)
    setError(null)
    const resultado = await deleteAccount()
    // Si todo va bien la server action redirige y esto no llega a ejecutarse.
    if (resultado?.error) {
      setError(resultado.error)
      setEnviando(false)
    }
  }

  if (!abierto) {
    return (
      <div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Puedes eliminar tu cuenta cuando quieras. Se borra todo y no se puede
          deshacer.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAbierto(true)}
          className="mt-3 w-full border-destructive/40 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          Eliminar mi cuenta
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-destructive">
            Esto no se puede deshacer
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Se borra tu perfil, tus conversaciones, tus publicaciones y tus
            contactos. Las personas con las que hablabas dejarán de ver el hilo.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Si solo necesitas parar un tiempo, arriba puedes desactivar tu perfil:
            dejas de aparecer y de recibir solicitudes, y tus conversaciones
            siguen ahí cuando vuelvas.
          </p>
        </div>
      </div>

      <label className="mt-4 block text-xs text-muted-foreground" htmlFor="confirmar-borrado">
        Escribe <strong className="font-semibold text-foreground">{CONFIRMACION}</strong> para confirmar
      </label>
      <input
        id="confirmar-borrado"
        type="text"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
      />

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setAbierto(false)
            setTexto('')
            setError(null)
          }}
          disabled={enviando}
          className="flex-1 text-xs"
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleBorrar}
          disabled={!puedeBorrar || enviando}
          className="flex-1 bg-destructive text-xs text-white hover:bg-destructive/90"
        >
          {enviando ? 'Eliminando…' : 'Eliminar para siempre'}
        </Button>
      </div>
    </div>
  )
}
