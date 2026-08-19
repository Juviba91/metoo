'use client'

import { useTransition } from 'react'
import { toggleProfileActive, deleteUserAccount, resolveReport } from './actions'

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
