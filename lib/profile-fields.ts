/**
 * Campos estructurados del perfil, en un único sitio.
 *
 * La idea es no pedir más texto libre: la bio media que escribe la gente son
 * ~98 caracteres de los 300 que puede usar. Quien está en mitad de un
 * diagnóstico o un duelo no se pone a redactar. Estas dos preguntas se
 * responden a toques y son lo que de verdad decide si dos personas encajan.
 *
 * `stage` usa vocabularios distintos según el rol (el voluntario dice cuánto
 * hace que lo vivió; quien busca apoyo, en qué punto está). `support_modes`
 * comparte valores entre roles a propósito: así "lo que ofrezco" y "lo que
 * busco" se pueden comparar directamente.
 */

export type Role = 'seeker' | 'volunteer'

export type Option = { value: string; label: string; hint?: string }

const VOLUNTEER_STAGES: Option[] = [
  { value: 'hace_menos_1', label: 'Hace menos de un año', hint: 'Lo tengo reciente' },
  { value: 'hace_1_3', label: 'Entre uno y tres años' },
  { value: 'hace_mas_3', label: 'Hace más de tres años', hint: 'Ya con distancia' },
]

const SEEKER_STAGES: Option[] = [
  { value: 'diagnostico', label: 'Acaba de empezar', hint: 'Diagnóstico o noticia reciente' },
  { value: 'tratamiento', label: 'Estoy en pleno proceso', hint: 'Tratamiento, ingreso, espera' },
  { value: 'despues', label: 'Ya pasó lo peor', hint: 'Pero sigo con ello' },
  { value: 'duelo', label: 'Estoy en duelo' },
]

/** Mismos valores para ambos roles, para poder cruzar oferta y necesidad. */
const SUPPORT_MODES: { value: string; volunteer: string; seeker: string }[] = [
  { value: 'escuchar', volunteer: 'Escuchar sin juzgar', seeker: 'Que me escuchen' },
  { value: 'experiencia', volunteer: 'Contar cómo lo viví', seeker: 'Saber cómo lo vivió otra persona' },
  { value: 'practico', volunteer: 'Orientar con lo práctico', seeker: 'Ayuda con lo práctico' },
  { value: 'presencial', volunteer: 'Acompañar en persona', seeker: 'Compañía en persona' },
]

export const STAGE_QUESTION: Record<Role, string> = {
  volunteer: '¿Cuánto hace que lo viviste?',
  seeker: '¿En qué momento estás?',
}

export const MODES_QUESTION: Record<Role, string> = {
  volunteer: '¿Cómo puedes acompañar?',
  seeker: '¿Qué te vendría bien?',
}

export function stageOptions(role: Role): Option[] {
  return role === 'volunteer' ? VOLUNTEER_STAGES : SEEKER_STAGES
}

export function modeOptions(role: Role): Option[] {
  return SUPPORT_MODES.map((m) => ({ value: m.value, label: role === 'volunteer' ? m.volunteer : m.seeker }))
}

export const ALL_STAGE_VALUES = [...VOLUNTEER_STAGES, ...SEEKER_STAGES].map((o) => o.value)
export const ALL_MODE_VALUES = SUPPORT_MODES.map((m) => m.value)

/** Etiqueta corta para pintar en tarjetas y perfiles. */
export function stageLabel(role: Role, value: string | null | undefined): string | null {
  if (!value) return null
  return stageOptions(role).find((o) => o.value === value)?.label ?? null
}

export function modeLabels(role: Role, values: string[] | null | undefined): string[] {
  if (!values?.length) return []
  const opts = modeOptions(role)
  return values.map((v) => opts.find((o) => o.value === v)?.label).filter((l): l is string => !!l)
}

/** Descarta cualquier valor que no esté en el vocabulario antes de guardar. */
export function sanitizeStage(value: unknown): string | null {
  return typeof value === 'string' && ALL_STAGE_VALUES.includes(value) ? value : null
}

export function sanitizeModes(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return [...new Set(values.filter((v): v is string => typeof v === 'string' && ALL_MODE_VALUES.includes(v)))]
}
