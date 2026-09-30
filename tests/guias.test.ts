import { describe, it, expect } from 'vitest'
import {
  agruparPorPregunta,
  etiquetaAutor,
  mesYAno,
  puedeEstarDesfasada,
  MESES_HASTA_CADUCAR,
  type FilaGuia,
} from '@/lib/guias'

const fila = (
  pregunta_id: string,
  orden: number,
  contenido: string,
  revisada_en = '2026-09-01T00:00:00Z',
): FilaGuia => ({
  pregunta_id,
  orden,
  enunciado: `Pregunta ${pregunta_id}`,
  ayuda: null,
  contenido,
  revisada_en,
})

describe('agruparPorPregunta', () => {
  it('apila varias respuestas bajo la misma pregunta', () => {
    // No se elige una respuesta "buena": dos familias pueden haber vivido
    // cosas distintas en la misma planta y las dos son verdad.
    const bloques = agruparPorPregunta([
      fila('p1', 1, 'Se puede dormir en la sala de familias'),
      fila('p1', 1, 'Yo dormí en el sofá de la tercera'),
    ])

    expect(bloques).toHaveLength(1)
    expect(bloques[0].respuestas).toHaveLength(2)
  })

  it('ordena las preguntas por su orden, no por como lleguen', () => {
    const bloques = agruparPorPregunta([
      fila('p3', 3, 'tercera'),
      fila('p1', 1, 'primera'),
      fila('p2', 2, 'segunda'),
    ])

    expect(bloques.map((b) => b.pregunta_id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('dentro de una pregunta, lo revisado más recientemente va primero', () => {
    // La información práctica caduca: lo último que alguien confirmó es lo que
    // más probablemente siga siendo cierto.
    const bloques = agruparPorPregunta([
      fila('p1', 1, 'viejo', '2025-01-01T00:00:00Z'),
      fila('p1', 1, 'nuevo', '2026-09-01T00:00:00Z'),
    ])

    expect(bloques[0].respuestas.map((r) => r.contenido)).toEqual(['nuevo', 'viejo'])
  })

  it('una guía sin aportaciones no da bloques', () => {
    expect(agruparPorPregunta([])).toEqual([])
  })
})

describe('mesYAno', () => {
  it('escribe el mes en castellano y sin el día', () => {
    // Sin día a propósito: una fecha exacta junto a un texto de un hospital
    // concreto acota demasiado quién pudo escribirlo.
    expect(mesYAno('2026-09-15T10:00:00Z')).toBe('septiembre de 2026')
    expect(mesYAno('2026-01-02T00:00:00Z')).toBe('enero de 2026')
  })

  it('no revienta con una fecha inválida', () => {
    expect(mesYAno('esto no es una fecha')).toBe('')
  })
})

describe('puedeEstarDesfasada', () => {
  const ahora = new Date('2026-09-30T00:00:00Z')

  it('marca lo que lleva demasiado sin confirmarse', () => {
    expect(puedeEstarDesfasada('2024-01-01T00:00:00Z', ahora)).toBe(true)
  })

  it('no marca lo reciente', () => {
    expect(puedeEstarDesfasada('2026-09-01T00:00:00Z', ahora)).toBe(false)
  })

  it('el corte está justo en el límite declarado', () => {
    const justo = new Date(ahora)
    justo.setUTCMonth(justo.getUTCMonth() - MESES_HASTA_CADUCAR)
    expect(puedeEstarDesfasada(justo.toISOString(), ahora)).toBe(true)

    const unoMenos = new Date(ahora)
    unoMenos.setUTCMonth(unoMenos.getUTCMonth() - (MESES_HASTA_CADUCAR - 1))
    expect(puedeEstarDesfasada(unoMenos.toISOString(), ahora)).toBe(false)
  })

  it('una fecha inválida no se marca como vieja', () => {
    expect(puedeEstarDesfasada('ayer', ahora)).toBe(false)
  })
})

describe('etiquetaAutor', () => {
  it('nombra el momento, no el papel en la app', () => {
    // «Voluntario» no le dice nada a quien llega de Google; «ya pasó por esto»
    // sí, y es la diferencia que cambia cómo se lee una respuesta.
    expect(etiquetaAutor('volunteer')).toBe('Ya pasó por esto')
    expect(etiquetaAutor('seeker')).toBe('Lo está viviendo')
  })

  it('sin autor no inventa etiqueta', () => {
    // La cuenta se dio de baja: la aportación se sigue viendo, sin etiqueta.
    expect(etiquetaAutor(null)).toBeNull()
    expect(etiquetaAutor(undefined)).toBeNull()
    expect(etiquetaAutor('otra-cosa')).toBeNull()
  })
})

describe('agruparPorPregunta: el rol viaja con la respuesta', () => {
  it('conserva el rol de cada aportación', () => {
    const bloques = agruparPorPregunta([
      { ...fila('p1', 1, 'desde dentro'), autor_rol: 'seeker' },
      { ...fila('p1', 1, 'ya salí', '2025-01-01T00:00:00Z'), autor_rol: 'volunteer' },
    ])

    expect(bloques[0].respuestas.map((r) => r.autor_rol)).toEqual(['seeker', 'volunteer'])
  })
})
