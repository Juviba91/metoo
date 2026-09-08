'use client'

import { useTransition } from 'react'
import { toggleProfileActive, deleteUserAccount, resolveReport, eliminarComentario } from './actions'

export function ToggleActiveBtn({ profileId, isActive }: { profileId: string; isActive: boolean }) {
  const [pending, start] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => start(() => toggleProfileActive(profileId, !isActive))}
      className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
    >
      {pending ? '...' : isActive ? 'Pausar' : 'Activar'}
    </button>
  )
}

export function DeleteUserBtn({ userId, alias }: { userId: string; alias: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => {
        if (!confirm(`¿Eliminar a ${alias} definitivamente? Esta acción no se puede deshacer.`)) return
        start(() => deleteUserAccount(userId))
      }}
      className="rounded-lg border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      {pending ? '...' : 'Eliminar'}
    </button>
  )
}

export function BorrarComentarioBtn({
  tabla,
  id,
}: {
  tabla: 'feedback' | 'hashtag_suggestions'
  id: string
}) {
  const [pending, start] = useTransition()
  return (
    <button
      disabled={pending}
      aria-label="Borrar"
      title="Borrar"
      onClick={() => {
        // Se pregunta porque no hay vuelta atrás: es lo único que queda de lo
        // que alguien se molestó en escribir.
        if (!confirm('¿Borrar esto? No se puede recuperar.')) return
        start(() => eliminarComentario(tabla, id))
      }}
      className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
    >
      {pending ? '...' : 'Borrar'}
    </button>
  )
}

export function ResolveReportBtn({ reportId }: { reportId: string }) {
  const [pending, start] = useTransition()
  return (
    <button
      disabled={pending}
      onClick={() => start(() => resolveReport(reportId))}
      className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50"
    >
      {pending ? '...' : 'Resolver'}
    </button>
  )
}
