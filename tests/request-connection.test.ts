import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock, type MockSpec } from './helpers/supabase-mock'

// El módulo real crea el cliente por petición; aquí se sustituye por el mock.
const state: { mock: ReturnType<typeof createSupabaseMock> } = {
  mock: createSupabaseMock(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// canInteractWith y checkRateLimit viven en safety/actions; se controlan aparte
const safety = {
  canInteractWith: vi.fn(async () => true),
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
}
vi.mock('@/app/safety/actions', () => ({
  canInteractWith: (...a: unknown[]) => safety.canInteractWith(...(a as [])),
  checkRateLimit: (...a: unknown[]) => safety.checkRateLimit(...(a as [])),
}))

const { requestConnection } = await import('@/app/dashboard/actions')

/** Las fichas que devuelve la consulta de `requestConnection`: la mía y la de a quien escribo. */
const ficha = (id: string, role: 'seeker' | 'volunteer', temas: ('seeker' | 'volunteer')[] = [role], deleted_at: string | null = null) => ({
  id,
  role,
  deleted_at,
  profile_hashtags: temas.map((t) => ({ role: t })),
})

const YO_BUSCO = ficha('seeker-1', 'seeker')
const ELLA_ACOMPANA = ficha('vol-1', 'volunteer')

function setup(spec: MockSpec) {
  state.mock = createSupabaseMock({
    user: { id: 'seeker-1' },
    ...spec,
    responses: {
      // Por defecto quien llama busca apoyo y la otra persona acompaña, y las
      // dos están de alta. `requestConnection` lo comprueba porque la ficha de
      // quien se da de baja se conserva (para no romperle la conversación a
      // nadie) pero no admite contacto nuevo.
      'profiles.select': { data: [YO_BUSCO, ELLA_ACOMPANA] },
      ...spec.responses,
    },
  })
  return state.mock
}

beforeEach(() => {
  vi.clearAllMocks()
  safety.canInteractWith.mockResolvedValue(true)
  safety.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 4 })
})

describe('requestConnection', () => {
  it('crea la conexión cuando no existe ninguna', async () => {
    const mock = setup({
      responses: {
        'connections.select': { data: null },
        'connections.insert': { data: { id: 'conn-nueva' } },
      },
    })

    const res = await requestConnection('vol-1')

    expect(res).toEqual({ success: true, connectionId: 'conn-nueva' })
    expect(mock.didCall('connections', 'insert')).toBe(true)
  })

  it('no duplica si ya hay una conexión pendiente: devuelve la existente', async () => {
    const mock = setup({
      responses: { 'connections.select': { data: { id: 'conn-previa', status: 'pending' } } },
    })

    const res = await requestConnection('vol-1')

    expect(res).toEqual({ success: true, connectionId: 'conn-previa' })
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('no vuelve a solicitar si la conexión fue rechazada', async () => {
    const mock = setup({
      responses: { 'connections.select': { data: { id: 'conn-previa', status: 'rejected' } } },
    })

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(res.success).toBeUndefined()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('resuelve la carrera si otra petición creó la conexión a la vez', async () => {
    const mock = setup({
      responses: {
        // primero no existe; tras el 23505 la relectura sí la encuentra
        'connections.select': [{ data: null }, { data: { id: 'conn-carrera' } }],
        'connections.insert': { data: null, error: { code: '23505' } },
      },
    })

    const res = await requestConnection('vol-1')

    expect(res).toEqual({ success: true, connectionId: 'conn-carrera' })
    expect(mock.didCall('connections', 'insert')).toBe(true)
  })

  it('rechaza contactarse a uno mismo', async () => {
    const mock = setup({})
    const res = await requestConnection('seeker-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('no permite contactar a un usuario bloqueado', async () => {
    safety.canInteractWith.mockResolvedValue(false)
    const mock = setup({})

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('respeta el rate limit', async () => {
    safety.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0 })
    const mock = setup({ responses: { 'connections.select': { data: null } } })

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('no consume rate limit cuando ya existía la conexión', async () => {
    setup({ responses: { 'connections.select': { data: { id: 'c1', status: 'pending' } } } })

    await requestConnection('vol-1')

    expect(safety.checkRateLimit).not.toHaveBeenCalled()
  })

  it('exige sesión', async () => {
    const mock = setup({ user: null })
    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })
})

describe('requestConnection: cuentas dadas de baja', () => {
  it('no deja empezar una conversación con quien se dio de baja', async () => {
    // Su ficha sigue existiendo para que las conversaciones que ya tenía no
    // desaparezcan, así que no basta con que no salga en los listados.
    const mock = setup({
      responses: {
        'profiles.select': {
          data: [YO_BUSCO, ficha('vol-1', 'volunteer', ['volunteer'], '2026-09-15T10:00:00Z')],
        },
        'connections.select': { data: null },
      },
    })

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('tampoco con un id que no existe', async () => {
    const mock = setup({
      responses: {
        'profiles.select': { data: [YO_BUSCO] },
        'connections.select': { data: null },
      },
    })

    const res = await requestConnection('vol-fantasma')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })
})

describe('requestConnection: cada cual solo escribe del lado que le toca', () => {
  it('quien acompaña no puede iniciar con quien también acompaña', async () => {
    const mock = setup({
      responses: {
        'profiles.select': { data: [ficha('seeker-1', 'volunteer'), ficha('vol-1', 'volunteer')] },
        'connections.select': { data: null },
      },
    })

    const res = await requestConnection('vol-1')

    // Hasta ahora esto lo impedía solo la interfaz: llamando a la acción directa
    // se podía escribir a cualquiera.
    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('quien busca no puede iniciar con quien también busca', async () => {
    const mock = setup({
      responses: {
        'profiles.select': { data: [YO_BUSCO, ficha('vol-1', 'seeker')] },
        'connections.select': { data: null },
      },
    })

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })

  it('quien acompaña pero también busca apoyo sí puede iniciar', async () => {
    const mock = setup({
      responses: {
        // Voluntaria de registro con un tema que está viviendo.
        'profiles.select': { data: [ficha('seeker-1', 'volunteer', ['volunteer', 'seeker']), ELLA_ACOMPANA] },
        'connections.select': { data: null },
        'connections.insert': { data: { id: 'conn-nueva' } },
      },
    })

    const res = await requestConnection('vol-1')

    expect(res).toEqual({ success: true, connectionId: 'conn-nueva' })
    expect(mock.didCall('connections', 'insert')).toBe(true)
  })

  it('se puede escribir a alguien que acompaña en un tema aunque se registrara buscando', async () => {
    const mock = setup({
      responses: {
        'profiles.select': { data: [YO_BUSCO, ficha('vol-1', 'seeker', ['seeker', 'volunteer'])] },
        'connections.select': { data: null },
        'connections.insert': { data: { id: 'conn-nueva' } },
      },
    })

    const res = await requestConnection('vol-1')

    expect(res.success).toBe(true)
    expect(mock.didCall('connections', 'insert')).toBe(true)
  })

  it('no inicia sin ficha propia', async () => {
    const mock = setup({
      responses: { 'profiles.select': { data: [ELLA_ACOMPANA] }, 'connections.select': { data: null } },
    })

    const res = await requestConnection('vol-1')

    expect(res.error).toBeTruthy()
    expect(mock.didCall('connections', 'insert')).toBe(false)
  })
})

describe('requestConnection: una sola conversación por pareja, en el sentido que sea', () => {
  it('busca la conexión existente en los dos sentidos', async () => {
    const mock = setup({
      responses: { 'connections.select': { data: { id: 'conn-de-ella', status: 'pending' } } },
    })

    const res = await requestConnection('vol-1')

    // Si ella ya te había escrito a ti, no se abre otra conversación al revés.
    expect(res).toEqual({ success: true, connectionId: 'conn-de-ella' })
    expect(mock.didCall('connections', 'insert')).toBe(false)

    const filtros = mock.filtros.filter((f) => f.table === 'connections' && f.metodo === 'in')
    expect(filtros.map((f) => f.args[0])).toEqual(['seeker_id', 'volunteer_id'])
    for (const f of filtros) expect(f.args[1]).toEqual(['seeker-1', 'vol-1'])
  })
})
