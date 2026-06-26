'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { requestConnection } from '@/app/dashboard/actions'
import { Heart, Check, Loader2 } from 'lucide-react'

export function ContactButton({
  volunteerId,
  alreadySent,
}: {
  volunteerId: string
  alreadySent: boolean
}) {
  const [sent, setSent] = useState(alreadySent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sent) {
    return (
      <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm text-muted-foreground">
        <Check className="size-3.5" /> Solicitud enviada
      </div>
    )
  }

  async function handleClick() {
    setLoading(true)
    setError(null)
    const result = await requestConnection(volunteerId)
    if (result.error) {
      setError('No se pudo enviar. Inténtalo de nuevo.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <>
      <Button size="sm" className="w-full gap-1.5" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Heart className="size-3.5" />}
        {loading ? 'Enviando...' : 'Contactar'}
      </Button>
      {error && <p className="mt-1 text-center text-xs text-destructive">{error}</p>}
    </>
  )
}
