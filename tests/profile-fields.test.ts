import { describe, it, expect } from 'vitest'
import {
  modeLabels,
  modeOptions,
  sanitizeModes,
  sanitizeStage,
  stageLabel,
  stageOptions,
} from '@/lib/profile-fields'

describe('saneado antes de guardar', () => {
  it('acepta los valores del vocabulario', () => {
    expect(sanitizeStage('duelo')).toBe('duelo')
    expect(sanitizeStage('hace_mas_3')).toBe('hace_mas_3')
    expect(sanitizeModes(['escuchar', 'practico'])).toEqual(['escuchar', 'practico'])
  })

  it('descarta lo que no está en el vocabulario', () => {
    // La restricción CHECK de la tabla también lo rechazaría, pero devolviendo
    // un error de base de datos en vez de un guardado limpio.
    expect(sanitizeStage('inventado')).toBeNull()
    expect(sanitizeStage(42)).toBeNull()
    expect(sanitizeModes(['escuchar', 'hackeo'])).toEqual(['escuchar'])
    expect(sanitizeModes('escuchar')).toEqual([])
    expect(sanitizeModes(null)).toEqual([])
  })

  it('deduplica los modos repetidos', () => {
    expect(sanitizeModes(['escuchar', 'escuchar', 'practico'])).toEqual(['escuchar', 'practico'])
  })

  it('trata el vacío como "sin responder", no como error', () => {
    expect(sanitizeStage(null)).toBeNull()
    expect(sanitizeStage(undefined)).toBeNull()
    expect(sanitizeModes([])).toEqual([])
  })
})

describe('vocabulario por rol', () => {
  it('cada rol tiene su propio conjunto de momentos', () => {
    const vol = stageOptions('volunteer').map((o) => o.value)
    const seek = stageOptions('seeker').map((o) => o.value)
    expect(vol).not.toEqual(seek)
    // Sin solape: un valor identifica de qué rol viene
    expect(vol.filter((v) => seek.includes(v))).toEqual([])
  })

  it('los modos comparten valores entre roles, para poder cruzarlos', () => {
    const vol = modeOptions('volunteer').map((o) => o.value)
    const seek = modeOptions('seeker').map((o) => o.value)
    expect(vol).toEqual(seek)
  })

  it('los modos se leen distinto según quién los escribió', () => {
    const vol = modeOptions('volunteer').find((o) => o.value === 'escuchar')
    const seek = modeOptions('seeker').find((o) => o.value === 'escuchar')
    expect(vol?.label).not.toBe(seek?.label)
  })
})

describe('etiquetas para pintar', () => {
  it('traduce valores a texto legible', () => {
    expect(stageLabel('seeker', 'duelo')).toBe('Estoy en duelo')
    expect(modeLabels('volunteer', ['escuchar'])).toEqual(['Escuchar sin juzgar'])
  })

  it('no rompe con perfiles antiguos que aún no tienen los campos', () => {
    expect(stageLabel('seeker', null)).toBeNull()
    expect(modeLabels('volunteer', null)).toEqual([])
    expect(modeLabels('volunteer', [])).toEqual([])
  })

  it('ignora un valor guardado que ya no exista en el vocabulario', () => {
    expect(stageLabel('seeker', 'retirado_del_menu')).toBeNull()
    expect(modeLabels('volunteer', ['escuchar', 'retirado'])).toEqual(['Escuchar sin juzgar'])
  })
})
