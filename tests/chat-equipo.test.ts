import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

const state: { mock: ReturnType<typeof createSupabaseMock>; admin: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
  admin: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))
// La clave de servicio es otro cliente: así se ve cuál de los dos escribe.
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => state.admin.client }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

class RedirectError extends Error {
  constructor(public destino: string) {
    super('NEXT_REDIRECT')
  }
}
vi.mock('next/navigation', () => ({
  redirect: (destino: string) => {
    throw new RedirectError(destino)
  },
}))

const { enviarAlEquipo } = await import('@/app/dashboard/equipo/actions')
const { responderComoEquipo } = await import('@/app/admin/mensajes/actions')

const ADMIN = { id: 'admin-1', email: 'baygual91@gmail.com' }
const ANA = { id: 'ana-1', email: 'ana@gmail.com' }

function setup(user: MockSpec['user'], adminSpec: MockSpec = {}) {
  state.mock = createSupabaseMock({ user })
  state.admin = createSupabaseMock(adminSpec)
  return state
}

const insertado = (m: ReturnType<typeof createSupabaseMock>) =>
  m.calls.find((c) => c.table === 'mensajes_equipo' && c.op === 'insert')?.payload

beforeEach(() => vi.clearAllMocks())

describe('enviarAlEquipo (la persona escribe)', () => {
  it('guarda el mensaje como suyo y nunca como del equipo, con su propia sesión', async () => {
    const { mock, admin } = setup(ANA)

    const res = await enviarAlEquipo('  Hola, estoy perdida  ')

    expect(res.success).toBe(true)
    expect(insertado(mock)).toEqual({ usuario_id: 'ana-1', del_equipo: false, contenido: 'Hola, estoy perdida' })
    expect(insertado(admin)).toBeUndefined()
  })

  it('sin sesión no escribe', async () => {
    const { mock } = setup(null)
    expect((await enviarAlEquipo('hola')).error).toBeTruthy()
    expect(insertado(mock)).toBeUndefined()
  })

  it('un mensaje vacío o enorme no llega a la base', async () => {
    const { mock } = setup(ANA)
    expect((await enviarAlEquipo('   ')).error).toBeTruthy()
    expect((await enviarAlEquipo('a'.repeat(2001))).error).toBeTruthy()
    expect(insertado(mock)).toBeUndefined()
  })

  it('si la base lo rechaza (p. ej. el límite por hora), lo dice sin romper', async () => {
    setup(ANA)
    state.mock = createSupabaseMock({
      user: ANA,
      responses: { 'mensajes_equipo.insert': { error: { message: 'Demasiados mensajes seguidos' } } },
    })
    expect((await enviarAlEquipo('hola')).error).toBeTruthy()
  })
})

describe('responderComoEquipo (Juan escribe)', () => {
  it('escribe como equipo con la clave de servicio', async () => {
    const { admin } = setup(ADMIN, { responses: { 'profiles.select': { data: { id: 'ana-1', deleted_at: null } } } })

    const res = await responderComoEquipo('ana-1', 'Bienvenida')

    expect(res.success).toBe(true)
    expect(insertado(admin)).toEqual({ usuario_id: 'ana-1', del_equipo: true, contenido: 'Bienvenida' })
  })

  it('a nadie que no sea el admin: se le echa y no se escribe nada', async () => {
    const { admin } = setup(ANA)
    await expect(responderComoEquipo('ana-1', 'Soy el equipo')).rejects.toBeInstanceOf(RedirectError)
    expect(insertado(admin)).toBeUndefined()
  })

  it('no escribe a quien se dio de baja', async () => {
    const { admin } = setup(ADMIN, { responses: { 'profiles.select': { data: { id: 'ana-1', deleted_at: '2026-11-01T00:00:00Z' } } } })
    expect((await responderComoEquipo('ana-1', 'hola')).error).toBeTruthy()
    expect(insertado(admin)).toBeUndefined()
  })

  it('no escribe a alguien que no existe', async () => {
    const { admin } = setup(ADMIN, { responses: { 'profiles.select': { data: null } } })
    expect((await responderComoEquipo('nadie', 'hola')).error).toBeTruthy()
    expect(insertado(admin)).toBeUndefined()
  })
})
