/**
 * Guías por tema: lo que aprendieron quienes ya pasaron por ello.
 *
 * Aquí solo va la lógica que se puede probar sin base de datos. Las consultas
 * están en las páginas, y la escritura en `aportar_a_tema` y `editar_aportacion`
 * (la base es la que manda: comprueba sesión, longitud y rate limit).
 */

export type FilaGuia = {
  /** Id de la aportación; con él se edita la propia. */
  id?: string
  pregunta_id: string
  orden: number
  enunciado: string
  ayuda: string | null
  contenido: string
  revisada_en: string
  /** 'seeker' | 'volunteer' en el tema de la guía, o null si la cuenta se dio de baja. */
  autor_rol?: string | null
  /** Alias de quien la escribió, o null si la cuenta ya no existe. */
  autor_alias?: string | null
  /** Para enlazar a su perfil. Null cuando el alias también lo es. */
  autor_id?: string | null
}

export type RespuestaGuia = {
  id?: string
  contenido: string
  revisada_en: string
  autor_rol?: string | null
  autor_alias?: string | null
  autor_id?: string | null
}

export type BloqueGuia = {
  pregunta_id: string
  orden: number
  enunciado: string
  ayuda: string | null
  respuestas: RespuestaGuia[]
}

/**
 * La vista devuelve una fila por aportación; la página se pinta por pregunta.
 *
 * Varias personas contestan la misma pregunta y todas las respuestas valen:
 * no se elige una "buena", se apilan. Dos familias pueden haber vivido cosas
 * distintas en la misma planta y las dos son verdad.
 *
 * Dentro de cada pregunta, lo revisado más recientemente primero: la
 * información práctica caduca, y lo último que alguien confirmó es lo que más
 * probablemente siga siendo cierto.
 */
export function agruparPorPregunta(filas: FilaGuia[]): BloqueGuia[] {
  const porPregunta = new Map<string, BloqueGuia>()

  for (const fila of filas) {
    let bloque = porPregunta.get(fila.pregunta_id)
    if (!bloque) {
      bloque = {
        pregunta_id: fila.pregunta_id,
        orden: fila.orden,
        enunciado: fila.enunciado,
        ayuda: fila.ayuda,
        respuestas: [],
      }
      porPregunta.set(fila.pregunta_id, bloque)
    }
    bloque.respuestas.push({
      id: fila.id,
      contenido: fila.contenido,
      revisada_en: fila.revisada_en,
      autor_rol: fila.autor_rol ?? null,
      autor_alias: fila.autor_alias ?? null,
      autor_id: fila.autor_id ?? null,
    })
  }

  const bloques = [...porPregunta.values()]
  for (const bloque of bloques) {
    bloque.respuestas.sort((a, b) => b.revisada_en.localeCompare(a.revisada_en))
  }

  return bloques.sort((a, b) => a.orden - b.orden)
}

/** Meses en castellano, para no arrastrar una librería de fechas. */
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * «septiembre de 2026». Sin día a propósito: una fecha exacta acota demasiado
 * quién pudo escribirlo.
 */
export function mesYAno(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  return `${MESES[fecha.getUTCMonth()]} de ${fecha.getUTCFullYear()}`
}

/**
 * ¿Lleva demasiado sin que nadie lo confirme?
 *
 * Los horarios cambian y la cafetería cierra. Un dato de hace dos años se lee
 * igual que uno de ayer si nada lo distingue, y eso es peor que no tenerlo.
 */
export const MESES_HASTA_CADUCAR = 18

export function puedeEstarDesfasada(iso: string, ahora: Date = new Date()): boolean {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return false

  const meses =
    (ahora.getUTCFullYear() - fecha.getUTCFullYear()) * 12 +
    (ahora.getUTCMonth() - fecha.getUTCMonth())

  return meses >= MESES_HASTA_CADUCAR
}

/**
 * Cómo se presenta el momento de quien escribió (el alias va aparte).
 *
 * Cambia cómo se lee una respuesta: alguien ingresado ahora y alguien que
 * salió hace tres años no cuentan lo mismo.
 *
 * Se nombra por el momento en que está, no por su papel en la app: «voluntario»
 * no le dice nada a quien llega de Google.
 */
export function etiquetaAutor(rol: string | null | undefined): string | null {
  if (rol === 'volunteer') return 'Ya pasó por esto'
  if (rol === 'seeker') return 'Lo está viviendo'
  return null
}
