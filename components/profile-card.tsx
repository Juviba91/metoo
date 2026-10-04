import { MapPin } from 'lucide-react'
import { modeLabels, stageLabel, type Role } from '@/lib/profile-fields'

export type FichaPerfil = {
  alias: string
  city: string | null
  bio: string | null
  role: string
  stage: string | null
  support_modes: string[] | null
  hashtags: { id: string; label: string }[]
}

/**
 * La ficha de una persona tal como la ve el otro rol.
 *
 * Es la misma en tu perfil y en el de los demás a propósito: así lo que ves
 * en «Perfil» es lo que ve de verdad quien te encuentra. Los botones de cada
 * caso (contactar, bloquear, editar) entran por `children`.
 */
export function ProfileCard({ perfil, children }: { perfil: FichaPerfil; children?: React.ReactNode }) {
  const role = perfil.role as Role
  const modos = modeLabels(role, perfil.support_modes)
  const etapa = stageLabel(role, perfil.stage)

  return (
    <div className="rounded-xl border border-border p-5 sm:p-6">
      <div className="mb-4">
        <p className="mb-1 text-sm text-muted-foreground">
          {role === 'volunteer' ? '💛 Ofreciendo ayuda' : '🤝 Buscando apoyo'}
        </p>
        <h1 className="text-2xl font-bold">{perfil.alias}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {perfil.city && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {perfil.city}
            </span>
          )}
          {etapa && <span>🕰️ {etapa}</span>}
        </div>
      </div>

      {perfil.hashtags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {perfil.hashtags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              #{tag.label}
            </span>
          ))}
        </div>
      )}

      {modos.length > 0 && (
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            {role === 'volunteer' ? 'Puede acompañar con' : 'Le vendría bien'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {modos.map((label) => (
              <span key={label} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {perfil.bio && (
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{perfil.bio}</p>
      )}

      {children && <div className="space-y-3">{children}</div>}
    </div>
  )
}
