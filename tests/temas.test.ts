import { describe, it, expect } from 'vitest'
import { partirTemas, temaTieneVida, textosTema, textoPublicaciones, type Tema } from '@/lib/temas'

const tema = (label: string, personas = 0, companeros = 0, publicaciones = 0): Tema => ({
  id: label,
  slug: label,
  label,
  personas,
  companeros,
  publicaciones,
})

describe('temaTieneVida', () => {
  it('cuenta cualquiera de las tres señales, no solo las personas', () => {
    // Importa de verdad: hoy el feed está a cero y no hay ni un seeker. Si
    // «tener vida» fuese solo `personas > 0`, a un voluntario le saldrían 28
    // temas vacíos, que es justo la sala desierta que se quería evitar.
    expect(temaTieneVida(tema('a', 2, 0, 0))).toBe(true)
    expect(temaTieneVida(tema('b', 0, 1, 0))).toBe(true)
    expect(temaTieneVida(tema('c', 0, 0, 3))).toBe(true)
    expect(temaTieneVida(tema('d'))).toBe(false)
  })
})

describe('partirTemas', () => {
  it('separa los que tienen algo detrás de los que no', () => {
    const { conVida, vacios } = partirTemas([tema('a', 1), tema('b'), tema('c', 0, 0, 2)])

    expect(conVida.map((x) => x.label)).toEqual(['a', 'c'])
    expect(vacios.map((x) => x.label)).toEqual(['b'])
  })

  it('no pierde ningún tema por el camino', () => {
    // Los vacíos son el catálogo: alguien tiene que poder encontrar el suyo y
    // ser el primero en ponérselo.
    const todos = [tema('a', 1), tema('b'), tema('c')]
    const { conVida, vacios } = partirTemas(todos)

    expect(conVida.length + vacios.length).toBe(todos.length)
  })

  it('respeta el orden que trae la base', () => {
    const { conVida } = partirTemas([tema('z', 5), tema('a', 2)])
    expect(conVida.map((x) => x.label)).toEqual(['z', 'a'])
  })
})

describe('textosTema', () => {
  it('a quien busca apoyo le habla de voluntarios', () => {
    const t = textosTema('seeker')
    expect(t.personas(3)).toBe('3 voluntarios')
    expect(t.personas(1)).toBe('1 voluntario')
  })

  it('al voluntario le habla de gente esperando', () => {
    const t = textosTema('volunteer')
    expect(t.personas(3)).toBe('3 personas buscando apoyo')
    expect(t.personas(1)).toBe('1 persona buscando apoyo')
  })

  it('el singular no dice "1 voluntarios"', () => {
    expect(textosTema('volunteer').companeros(1)).toBe('1 voluntario más')
    expect(textosTema('seeker').companeros(1)).toBe('1 persona más en lo mismo')
    expect(textoPublicaciones(1)).toBe('1 publicación')
    expect(textoPublicaciones(2)).toBe('2 publicaciones')
  })

  it('cada rol ve un texto distinto para lo mismo', () => {
    expect(textosTema('seeker').verPersonas).not.toBe(textosTema('volunteer').verPersonas)
  })
})
