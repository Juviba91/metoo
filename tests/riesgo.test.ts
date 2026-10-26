import { describe, it, expect } from 'vitest'
import { hayRiesgo } from '@/lib/riesgo'

describe('hayRiesgo', () => {
  it.each([
    'Ya no puedo más',
    'NO PUEDO MAS con esto',
    'a veces pienso en quitarme la vida',
    'he pensado en el suicidio',
    'me quiero morir',
    'no quiero seguir viviendo así… no quiero vivir',
    'tengo ganas de desaparecer',
    'quiero acabar con todo',
    'a veces quiero hacerme daño',
    'todos estarían mejor sin mí',
  ])('salta con %j', (texto) => {
    expect(hayRiesgo(texto)).toBe(true)
  })

  it.each([
    'Hola, ¿cómo estás?',
    'Mi hijo nació a las 28 semanas',
    'Puedo más de lo que creía',
    'La planta 2 tiene sala de padres',
    '',
  ])('no salta con %j', (texto) => {
    expect(hayRiesgo(texto)).toBe(false)
  })
})
