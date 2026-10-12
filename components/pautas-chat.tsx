import Link from 'next/link'

const PAUTAS = {
  seeker: [
    'No des datos que te identifiquen: apellidos, teléfono, tu hospital.',
    'Puedes parar cuando quieras. No le debes a nadie una respuesta.',
    'Si algo te incomoda, bloquea o reporta. No tienes que explicarlo.',
  ],
  volunteer: [
    'Cuenta lo que viviste tú. Sin diagnósticos ni recomendar tratamientos.',
    'No presiones para seguir fuera de la app: eso lo decide la otra persona.',
    'Si notas que está en riesgo, recuérdale el 024. No tienes que cargarlo tú.',
  ],
} as const

/**
 * Las tres cosas que más importan al escribir, según tu papel.
 *
 * Van en el chat porque es donde se aplican: las normas completas se aceptan
 * al registrarse y nadie vuelve a leerlas. Tres líneas, no un muro: quien
 * llega aquí suele estar en un mal momento.
 */
export function PautasChat({ rol }: { rol: 'seeker' | 'volunteer' }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 text-left">
      <p className="mb-2 text-sm font-semibold text-foreground">Antes de escribir</p>
      <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        {PAUTAS[rol].map((pauta) => (
          <li key={pauta} className="flex gap-2">
            <span aria-hidden>·</span>
            <span>{pauta}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/guidelines"
        target="_blank"
        className="mt-3 inline-block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Normas completas de la comunidad
      </Link>
    </div>
  )
}
