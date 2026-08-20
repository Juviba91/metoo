'use client'

import { useState } from 'react'
import { blockUser, unblockUser } from '@/app/safety/actions'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'

export function BlockButton({
  userId,
  isBlocked,
  onBlockChange,
}: {
  userId: string
  isBlocked: boolean
  onBlockChange?: (blocked: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(isBlocked)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = blocked
        ? await unblockUser(userId)
        : await blockUser(userId)

      if (result.error) {
        setError(result.error)
      } else {
        setBlocked(!blocked)
        onBlockChange?.(!blocked)
      }
    } catch (err) {
      setError('Error al actualizar bloqueo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleToggle}
        disabled={loading}
        variant={blocked ? 'default' : 'outline'}
        size="sm"
        className={blocked ? 'bg-destructive hover:bg-destructive/90' : ''}
      >
        <Shield className="size-4 mr-2" />
        {blocked ? 'Desbloqueado' : 'Bloquear usuario'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
