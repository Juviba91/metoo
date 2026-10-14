import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'
import {
  VERSION_TEXTOS_LEGALES,
  consentimientoAlDia,
  valorCookieConsentimiento,
} from '@/lib/legal'

const state: { mock: ReturnType<typeof createSupabaseMock> } = { mock: createSupabaseMock() }

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))

const jar = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n)! } : undefined),
    set: (n: string, v: string) => jar.set(n, v),
  }),
}))

const { renovarConsentimiento } = await import('@/app/dashboard/consentimiento/actions')

function setup(spec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user: { id: 'user-1' }, ...spec })
  return state.mock
}

const ok = { nacimiento: '1990-05-01', aceptaTextos: true, consentimientoSalud: true }

beforeEach(() => {
  vi.clearAllMocks()
  jar.clear()
})

describe('consentimientoAlDia', () => {
  const al_dia = {
    consentimiento_version: VERSION_TEXTOS_LEGALES,
    consentimiento_salud_en: '2026-10-14T10:00:00Z',
    edad_comprobada_en: '2026-10-14T10:00:00Z',
  }

  it('sí, con los tres registros y la versión actual', () => {
    expect(consentimientoAlDia(al_dia)).toBe(true)
  })

  it.each([
    ['una cuenta de antes de la casilla de salud', { consentimiento_salud_en: null }],
    ['sin edad comprobada', { edad_comprobada_en: null }],
    ['con los textos de antes', { consentimiento_version: '2026-10-09' }],
    ['sin ningún registro (cuentas de antes de octubre)', { consentimiento_version: null }],
  ])('no, %s', (_n, cambio) => {
    expect(consentimientoAlDia({ ...al_dia, ...cambio })).toBe(false)
  })
})

describe('renovarConsentimiento', () => {
  it('guarda la versión actual por la función de la base y deja la cookie de esta cuenta', async () => {
    const mock = setup()

    const res = await renovarConsentimiento(ok)

    expect(res.success).toBe(true)
    expect(mock.rpcCalls).toEqual([
      {
        name: 'renovar_consentimiento',
        args: { p_version: VERSION_TEXTOS_LEGALES, p_nacimiento: '1990-05-01' },
      },
    ])
    expect(jar.get('mt_consentimiento')).toBe(valorCookieConsentimiento('user-1'))
  })

  it.each([
    ['sin aceptar los textos', { aceptaTextos: false }],
    ['sin el permiso de salud', { consentimientoSalud: false }],
    ['con menos de 16 años', { nacimiento: '2015-01-01' }],
  ])('no guarda nada %s', async (_n, cambio) => {
    const mock = setup()

    const res = await renovarConsentimiento({ ...ok, ...cambio })

    expect(res.error).toBeTruthy()
    expect(mock.rpcCalls).toEqual([])
    expect(jar.has('mt_consentimiento')).toBe(false)
  })

  it('si la base falla, no deja pasar', async () => {
    setup({ rpc: { renovar_consentimiento: { error: { message: 'boom' } } } })

    const res = await renovarConsentimiento(ok)

    expect(res.error).toBeTruthy()
    expect(jar.has('mt_consentimiento')).toBe(false)
  })
})

describe('la vista pública de las guías (última definición en las migraciones)', () => {
  const DIR = join(process.cwd(), 'supabase', 'migrations')
  const defs = readdirSync(DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .flatMap((f) => readFileSync(join(DIR, f), 'utf8').match(/CREATE (?:OR REPLACE )?VIEW public\.guias_publicas AS[\s\S]*?;/g) ?? [])
  const ultima = defs[defs.length - 1] ?? ''

  it('no expone el alias ni el id de quien escribe', () => {
    expect(ultima).toContain('guias_publicas')
    expect(ultima).not.toMatch(/AS autor_alias|r\.autor_id\s*(,|\n\s*FROM)/)
    expect(ultima).not.toMatch(/a\.alias/)
  })
})
