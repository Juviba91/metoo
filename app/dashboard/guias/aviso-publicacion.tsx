'use client'

import { useState } from 'react'

/**
 * El aviso antes de escribir en una guía, con casilla.
 *
 * Antes era solo un texto. La nota legal pide que haya un acto expreso antes
 * de publicar algo que puede revelar datos de salud en una página que lee
 * cualquiera: hasta que no se marca, no salen las preguntas.
 */
export function AvisoPublicacion({ children }: { children: React.ReactNode }) {
  const [entendido, setEntendido] = useState(false)

  return (
    <>
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 text-sm leading-relaxed dark:border-amber-800/60 dark:bg-amber-950/20">
        <p className="font-semibold">Esto se publica, sin tu alias</p>
        <p className="mt-1 text-muted-foreground">
          Lo que escribas lo podrá leer cualquiera, también sin tener cuenta. No lleva tu alias
          ni enlaza a tu perfil, y pedimos a los buscadores que no lo indexen. Aun así, el
          hospital, el tema y lo que cuentes pueden bastar para que alguien de tu entorno te
          reconozca, sobre todo si el hospital es pequeño: no cuentes nada que te identifique
          —ni fechas exactas, ni nombres de personas del hospital— y nada sobre tratamientos
          o medicación.
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={entendido}
            onChange={(e) => setEntendido(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-foreground"
          />
          <span className="font-medium text-foreground">
            Entendido: lo que escriba aquí será público.
          </span>
        </label>
      </div>

      {entendido && children}
    </>
  )
}
