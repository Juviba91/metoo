/**
 * Los teléfonos de ayuda, en el chat, en cuanto aparece una expresión de
 * riesgo (ver lib/riesgo.ts).
 *
 * Dos versiones: si lo has escrito tú (o lo estás escribiendo), te habla a ti;
 * si lo ha escrito la otra persona, te dice qué hacer sin cargarte con ello.
 * Los números van como enlaces `tel:` porque en el móvil se pulsan.
 */
export function AvisoRiesgo({
  quien,
  onCerrar,
}: {
  quien: 'yo' | 'otra'
  onCerrar?: () => void
}) {
  return (
    <div
      role="note"
      className="relative rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 pr-9 text-sm leading-relaxed"
    >
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="absolute right-2 top-2 rounded-md px-1.5 text-base leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          ×
        </button>
      )}
      {quien === 'yo' ? (
        <>
          <p className="font-semibold text-foreground">Si estás pensando en hacerte daño, no tienes que pasarlo a solas.</p>
          <p className="mt-1 text-muted-foreground">
            Llama ahora al{' '}
            <a href="tel:024" className="font-semibold text-foreground underline underline-offset-2">
              024
            </a>{' '}
            (gratis, 24 horas, confidencial). Si hay peligro inmediato, al{' '}
            <a href="tel:112" className="font-semibold text-foreground underline underline-offset-2">
              112
            </a>
            . La persona de aquí puede tardar en leerte.
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold text-foreground">Lo que te han escrito puede ser una señal de riesgo.</p>
          <p className="mt-1 text-muted-foreground">
            No tienes que cargarlo tú. Recuérdale el{' '}
            <a href="tel:024" className="font-semibold text-foreground underline underline-offset-2">
              024
            </a>{' '}
            (gratis, 24 horas). Si crees que hay peligro inmediato, llama al{' '}
            <a href="tel:112" className="font-semibold text-foreground underline underline-offset-2">
              112
            </a>{' '}
            y repórtalo con la bandera de arriba.
          </p>
        </>
      )}
    </div>
  )
}
