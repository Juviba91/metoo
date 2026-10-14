/**
 * Comprobación de edad al registrarse (y al renovar el consentimiento).
 *
 * Antes era una casilla de «tengo al menos 16 años», que es lo mínimo que se
 * puede pedir. Ahora se pide la fecha de nacimiento, se calcula aquí y NO se
 * guarda: solo queda anotado que la comprobación se superó y cuándo
 * (`profiles.edad_comprobada_en`). Guardar la fecha sería tener un dato más
 * que no hace falta.
 *
 * Quien no llega se queda sin poder seguir durante 24 horas en ese navegador
 * (`COOKIE_MENOR`): sin eso bastaría con darle a «atrás» y poner otro año.
 */
export const EDAD_MINIMA = 16

/** Cookie que bloquea el registro un día tras declarar menos de 16 años. */
export const COOKIE_MENOR = 'mt_menor'
export const BLOQUEO_MENOR_SEGUNDOS = 24 * 60 * 60

/**
 * Años cumplidos a fecha `hoy`, o null si la fecha no es válida (formato,
 * fecha imposible, futura o de hace más de 120 años).
 *
 * Se trabaja con año, mes y día, sin horas: con `Date` y husos horarios, el
 * día del cumpleaños puede caer en el anterior.
 */
export function edadEn(nacimiento: string, hoy: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nacimiento ?? '')
  if (!m) return null
  const [a, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]

  // Descarta el 31 de febrero y compañía: Date lo convertiría en marzo.
  const comprobada = new Date(Date.UTC(a, mes - 1, dia))
  if (
    comprobada.getUTCFullYear() !== a ||
    comprobada.getUTCMonth() !== mes - 1 ||
    comprobada.getUTCDate() !== dia
  ) {
    return null
  }

  const [ha, hm, hd] = [hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate()]
  let edad = ha - a
  if (hm < mes || (hm === mes && hd < dia)) edad -= 1

  if (edad < 0 || edad > 120) return null
  return edad
}

export type ResultadoEdad = { ok: true } | { ok: false; menor: boolean; error: string }

export function comprobarEdad(nacimiento: string, hoy: Date = new Date()): ResultadoEdad {
  const edad = edadEn(nacimiento, hoy)
  if (edad === null) {
    return { ok: false, menor: false, error: 'Revisa la fecha de nacimiento.' }
  }
  if (edad < EDAD_MINIMA) {
    return {
      ok: false,
      menor: true,
      error: `metoo es para mayores de ${EDAD_MINIMA} años, así que no puedes crear una cuenta.`,
    }
  }
  return { ok: true }
}
