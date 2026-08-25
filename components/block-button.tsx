'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { blockUser, unblockUser } from '@/app/safety/actions'
import { Button } from '@/components/ui/button'
import { Shield, ShieldOff } from 'lucide-react'

export function BlockButton({
  userId,
  isBlocked,
}: {
  userId: string
  isBlocked: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(isBlocked)
  const [error, setError] = useState<string | null>(null)

  const busy = loading || pending

  async function handleToggle() {
    setLoading(true)
    setError(null)

    const result = blocked ? await unblockUser(userId) : await blockUser(userId)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setBlocked(!blocked)
    setLoading(false)
    // Refresca los server components para que las listas reflejen el cambio
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleToggle}
        disabled={busy}
        variant="outline"
        size="sm"
        className={blocked ? '' : 'text-destructive hover:text-destructive'}
      >
        {blocked ? <ShieldOff className="mr-2 size-4" /> : <Shield className="mr-2 size-4" />}
        {busy ? 'Guardando...' : blocked ? 'Desbloquear' : 'Bloquear usuario'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
