'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { marcarGuiaVoluntarioLeida } from '@/app/dashboard/actions'

export function LeidoBoton({ yaLeida }: { yaLeida: boolean }) {
  const router = useRouter()
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (yaLeida) {
    return (
      <p className="rounded-lg bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
        ✓ Ya la habías leído. Puedes volver cuando quieras.
      </p>
    )
  }

  async function leido() {
    setEnviando(true)
    setError(null)
    const res = await marcarGuiaVoluntarioLeida()
    if (res.error) {
      setError(res.error)
      setEnviando(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div>
      <Button onClick={leido} disabled={enviando} className="w-full">
        {enviando ? 'Guardando…' : 'Lo he leído'}
      </Button>
      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
