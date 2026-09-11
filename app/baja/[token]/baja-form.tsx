'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { darDeBaja } from './actions'

export function BajaForm({ token, alias }: { token: string; alias: string }) {
  const [hecho, setHecho] = useState(false)
  const [error, setError] = useState(false)
  const [pendiente, empezar] = useTransition()

  if (hecho) {
    return (
      <>
        <h1 className="mt-6 text-lg font-semibold">Listo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No te avisaremos más de que hay gente esperando. Los avisos de
          mensajes y solicitudes siguen llegando; si tampoco los quieres, se
          apagan en tu perfil.
        </p>
      </>
    )
  }

  return (
    <>
      <h1 className="mt-6 text-lg font-semibold">
        ¿Dejar de recibir estos avisos?
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Hola, {alias}. Dejaríamos de escribirte cuando haya alguien buscando
        apoyo. Los avisos de mensajes y solicitudes no se tocan.
      </p>

      {error && (
        <p className="mt-3 text-sm text-destructive">
          No se ha podido. Inténtalo otra vez o escríbenos a juan@bay-apps.com.
        </p>
      )}

      <Button
        variant="outline"
        className="mt-5 w-full"
        disabled={pendiente}
        onClick={() =>
          empezar(async () => {
            const r = await darDeBaja(token)
            if (r.ok) setHecho(true)
            else setError(true)
          })
        }
      >
        {pendiente ? 'Un momento…' : 'Sí, dejar de recibirlos'}
      </Button>
    </>
  )
}
