import type { HashtagOption } from '@/components/hashtag-picker'
import type { Rol } from '@/lib/lados'

const OPCIONES: { rol: Rol; texto: string }[] = [
  { rol: 'volunteer', texto: 'Lo viví' },
  { rol: 'seeker', texto: 'Lo estoy viviendo' },
]

/**
 * De qué lado estás en cada tema: «lo viví» (puedes acompañar a quien lo esté
 * pasando) o «lo estoy viviendo» (buscas apoyo).
 *
 * Una misma persona puede tener las dos cosas: haber pasado por unos prematuros
 * y estar ahora en un duelo. Por eso se elige por tema y no por cuenta. Son dos
 * opciones cerradas: quien está en mitad de un diagnóstico no redacta nada.
 */
export function PapelPorTema({
  temas,
  rolDe,
  onChange,
}: {
  temas: HashtagOption[]
  rolDe: (id: string) => Rol
  onChange: (id: string, rol: Rol) => void
}) {
  return (
    <div className="mt-5 rounded-lg border border-border/60 p-4">
      <p className="text-sm font-medium">¿Qué es cada tema para ti?</p>
      <p className="mb-3 mt-1 text-xs leading-relaxed text-muted-foreground">
        «Lo viví»: puedes acompañar a quien lo esté pasando. «Lo estoy viviendo»: buscas apoyo.
        Puedes tener de las dos en la misma cuenta.
      </p>
      <ul className="divide-y divide-border/50">
        {temas.map((tema) => (
          <li key={tema.id} className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <span className="min-w-0 truncate text-sm">#{tema.label}</span>
            <div
              role="group"
              aria-label={`Qué es ${tema.label} para ti`}
              className="inline-flex shrink-0 rounded-full border border-border p-0.5 text-xs"
            >
              {OPCIONES.map(({ rol, texto }) => {
                const activo = rolDe(tema.id) === rol
                return (
                  <button
                    key={rol}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => onChange(tema.id, rol)}
                    className={`rounded-full px-3 py-1 transition-colors ${
                      activo
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {texto}
                  </button>
                )
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
