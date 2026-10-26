/**
 * Detección de expresiones de riesgo en el chat, para enseñar los teléfonos
 * de ayuda en el momento en que hacen falta.
 *
 * La nota legal (medida I-6) pide aviso inmediato en pantalla del 024 y el
 * 112. Se hace en el propio navegador: el texto no se envía a ningún sitio ni
 * se guarda que saltó el aviso. No modera ni bloquea nada; solo enseña ayuda.
 *
 * Mejor que salte de más que de menos: un aviso innecesario se cierra, uno que
 * falta no se recupera. Por eso las frases son amplias y se comparan sin
 * tildes ni mayúsculas.
 */
const PATRONES: RegExp[] = [
  /suicid/,
  /quitarme la vida/,
  /quitarse la vida/,
  /\bmatarme\b/,
  /\bmorirme\b/,
  /me quiero morir/,
  /quiero morirme/,
  /no quiero (seguir )?vivir/,
  /no quiero seguir (aqui|adelante)/,
  /ganas de (morir|desaparecer)/,
  /acabar con todo/,
  /acabar con mi vida/,
  /terminar con todo/,
  /no puedo mas/,
  /no aguanto mas/,
  /hacerme dano/,
  /autolesi/,
  /cortarme/,
  /desaparecer para siempre/,
  /(estarian|estariais|estaria|estarias) mejor sin mi/,
  /mejor (estarian|estaria|estarias) sin mi/,
  /no tiene sentido (vivir|seguir)/,
]

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

export function hayRiesgo(texto: string | null | undefined): boolean {
  if (!texto) return false
  const t = normalizar(texto)
  return PATRONES.some((p) => p.test(t))
}
