import { describe, it, expect, vi, beforeEach } from 'vitest'

const envios: { endpoint: string; payload: string }[] = []
const borrados: string[] = []
let fallo: number | null = null

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(async (sub: { endpoint: string }, payload: string) => {
      if (fallo && sub.endpoint.endsWith('/vieja')) throw Object.assign(new Error('gone'), { statusCode: fallo })
      envios.push({ endpoint: sub.endpoint, payload })
    }),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (tabla: string) => ({
      select: () => ({
        eq: () =>
          tabla === 'push_suscripciones'
            ? Promise.resolve({
                data: [
                  { id: 's1', endpoint: 'https://push.example/buena', p256dh: 'k', auth: 'a' },
                  { id: 's2', endpoint: 'https://push.example/vieja', p256dh: 'k', auth: 'a' },
                ],
              })
            : { maybeSingle: async () => ({ data: { alias: 'Bea' } }) },
      }),
      delete: () => ({ eq: async (_c: string, id: string) => { borrados.push(id); return {} } }),
    }),
  }),
}))

beforeEach(() => {
  envios.length = 0
  borrados.length = 0
  fallo = null
  vi.resetModules()
})

describe('avisos push', () => {
  it('sin claves VAPID configuradas no envía nada', async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    delete process.env.VAPID_PRIVATE_KEY
    const { avisarMensaje } = await import('@/lib/push')

    await avisarMensaje('c1', 'u-bea', 'u-ana')

    expect(envios).toEqual([])
  })

  it('avisa a cada dispositivo con quién escribe, nunca qué', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub'
    process.env.VAPID_PRIVATE_KEY = 'priv'
    const { avisarMensaje } = await import('@/lib/push')

    await avisarMensaje('c1', 'u-bea', 'u-ana')

    expect(envios).toHaveLength(2)
    expect(JSON.parse(envios[0].payload)).toEqual({
      titulo: 'Nuevo mensaje en metoo',
      cuerpo: 'Bea te ha escrito',
      url: '/dashboard/chat/c1',
      etiqueta: 'chat-c1',
    })
  })

  it('borra las suscripciones que el servicio da por muertas', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub'
    process.env.VAPID_PRIVATE_KEY = 'priv'
    fallo = 410
    const { avisarSolicitud } = await import('@/lib/push')

    await avisarSolicitud('c1', 'u-bea', 'u-ana')

    expect(envios.map((e) => e.endpoint)).toEqual(['https://push.example/buena'])
    expect(borrados).toEqual(['s2'])
  })
})
