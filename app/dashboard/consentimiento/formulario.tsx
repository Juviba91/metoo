'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConsentimientoCampos } from '@/components/consentimiento-campos'
import { renovarConsentimiento } from './actions'

export function FormularioConsentimiento({ destino }: { destino: string }) {
  const router = useRouter()
  const [nacimiento, setNacimiento] = useState('')
  const [aceptaTextos, setAceptaTextos] = useState(false)
  const [salud, setSalud] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function aceptar() {
    setEnviando(true)
    setError(null)
    const res = await renovarConsentimiento({
      nacimiento,
      aceptaTextos,
      consentimientoSalud: salud,
    })
    if (res.error) {
      setError(res.error)
      setEnviando(false)
      return
    }
    router.replace(destino)
  }

  return (
    <div className="space-y-5">
      <ConsentimientoCampos
        nacimiento={nacimiento}
        onNacimiento={setNacimiento}
        aceptaTextos={aceptaTextos}
        onAceptaTextos={setAceptaTextos}
        salud={salud}
        onSalud={setSalud}
      />

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        onClick={aceptar}
        disabled={!nacimiento || !aceptaTextos || !salud || enviando}
        className="w-full"
      >
        {enviando ? 'Guardando…' : 'Aceptar y seguir'}
      </Button>
    </div>
  )
}
