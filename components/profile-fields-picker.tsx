'use client'

import { Check } from 'lucide-react'
import {
  MODES_QUESTION,
  STAGE_QUESTION,
  modeOptions,
  stageOptions,
  type Role,
} from '@/lib/profile-fields'

/**
 * Las dos preguntas de opción cerrada del perfil. Se usa igual en el
 * onboarding y en la pantalla de edición, para que no se separen.
 */
export function ProfileFieldsPicker({
  role,
  stage,
  modes,
  onStageChange,
  onModesChange,
  compact = false,
}: {
  role: Role
  stage: string | null
  modes: string[]
  onStageChange: (value: string | null) => void
  onModesChange: (values: string[]) => void
  compact?: boolean
}) {
  function toggleMode(value: string) {
    onModesChange(modes.includes(value) ? modes.filter((m) => m !== value) : [...modes, value])
  }

  return (
    <div className={compact ? 'space-y-5' : 'space-y-7'}>
      <fieldset>
        <legend className="mb-1 text-sm font-medium">{STAGE_QUESTION[role]}</legend>
        <p className="mb-3 text-xs text-muted-foreground">
          Ayuda a encontrar a alguien en un momento parecido al tuyo.
        </p>
        <div className="space-y-2">
          {stageOptions(role).map((opt) => {
            const selected = stage === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                // Volver a pulsar la opción elegida la deselecciona: el campo
                // es opcional y no debe quedarse atrapado.
                onClick={() => onStageChange(selected ? null : opt.value)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selected
                    ? 'border-foreground bg-muted/50'
                    : 'border-border hover:border-foreground/40 hover:bg-muted/30'
                }`}
              >
                <span>
                  <span className="font-medium">{opt.label}</span>
                  {opt.hint && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
                  )}
                </span>
                {selected && <Check className="size-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-medium">{MODES_QUESTION[role]}</legend>
        <p className="mb-3 text-xs text-muted-foreground">
          Puedes elegir varias. Así nadie espera algo distinto de lo que hay.
        </p>
        <div className="flex flex-wrap gap-2">
          {modeOptions(role).map((opt) => {
            const selected = modes.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleMode(opt.value)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors ${
                  selected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                }`}
              >
                {selected && <Check className="size-3.5" />}
                {opt.label}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
