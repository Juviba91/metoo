'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { requestConnection } from '@/app/dashboard/actions'
import { Heart, Loader2, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export function ContactButton({
  volunteerId,
  alreadySent,
  connectionId: initialConnectionId,
}: {
  volunteerId: string
  alreadySent: boolean
  connectionId?: string
}) {
  const [connectionId, setConnectionId] = useState<string | undefined>(initialConnectionId)
  const [sent, setSent] = useState(alreadySent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sent && connectionId) {
    return (
      <Link
        href={`/dashboard/chat/${connectionId}`}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
      >
        <MessageCircle className="size-3.5" /> Ver conversación →
      </Link>
    )
  }

  if (sent) {
    return (
      <div className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm text-muted-foreground">
        ✓ Solicitud enviada
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
    if (result.connectionId) setConnectionId(result.connectionId)
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
