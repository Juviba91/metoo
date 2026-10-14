'use client'

import Link from 'next/link'
import { EDAD_MINIMA } from '@/lib/edad'

/**
 * Las tres cosas que hacen falta para usar metoo: edad, textos y permiso para
 * tratar datos de salud. Las mismas al registrarse y al renovar el
 * consentimiento, para que no digan cosas distintas.
 *
 * Cada una por separado, a propósito: el consentimiento de salud (art. 9 RGPD)
 * tiene que ser explícito y no puede ir mezclado con la aceptación de unos
 * textos, y la edad se comprueba con la fecha, no con una casilla.
 */
export function ConsentimientoCampos({
  nacimiento,
  onNacimiento,
  aceptaTextos,
  onAceptaTextos,
  salud,
  onSalud,
}: {
  nacimiento: string
  onNacimiento: (v: string) => void
  aceptaTextos: boolean
  onAceptaTextos: (v: boolean) => void
  salud: boolean
  onSalud: (v: boolean) => void
}) {
  const enlace =
    'font-medium text-foreground underline underline-offset-2 hover:no-underline'

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="nacimiento" className="mb-1.5 block text-sm font-medium">
          Fecha de nacimiento
        </label>
        <input
          id="nacimiento"
          type="date"
          value={nacimiento}
          onChange={(e) => onNacimiento(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Solo para comprobar que tienes al menos {EDAD_MINIMA} años. No la guardamos: anotamos
          que la comprobación se superó y cuándo.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={aceptaTextos}
          onChange={(e) => onAceptaTextos(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-foreground"
        />
        <span className="text-sm text-muted-foreground">
          He leído y acepto las{' '}
          <Link href="/guidelines" target="_blank" className={enlace}>
            normas de la comunidad
          </Link>
          {', los '}
          <Link href="/terminos" target="_blank" className={enlace}>
            términos de uso
          </Link>
          {' y la '}
          <Link href="/privacidad" target="_blank" className={enlace}>
            política de privacidad
          </Link>
          .
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={salud}
          onChange={(e) => onSalud(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-foreground"
        />
        <span className="text-sm text-muted-foreground">
          Autorizo expresamente que metoo trate la información sobre mi salud, la de mi familia
          o un duelo que yo decida contar en mi descripción, mis etiquetas, mis mensajes y las
          guías, para ponerme en contacto con otras personas. Puedo retirar este permiso
          cuando quiera eliminando mi cuenta; qué pasa con mis conversaciones lo explica la
          política de privacidad.
        </span>
      </label>
    </div>
  )
}
