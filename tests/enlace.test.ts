import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = {
  signInWithOtp: vi.fn(async (_: unknown) => ({ error: null as null | { status?: number; message: string } })),
  verifyOtp: vi.fn(async (_: unknown) => ({ error: null as null | { message: string } })),
}
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth }), getUser: async () => null }))
vi.mock('next/headers', () => ({
  headers: async () => new Map([['host', 'www.metoonetwork.xyz'], ['x-forwarded-proto', 'https']]),
}))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const { enviarEnlace, verificarCodigo } = await import('@/app/auth/actions')

beforeEach(() => vi.clearAllMocks())

describe('enviarEnlace', () => {
  it('crea la cuenta si no existe y vuelve a una ruta interna', async () => {
    const res = await enviarEnlace(' Ana@Gmail.com ', '/dashboard?tema=duelo')

    expect(res.success).toBe(true)
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@gmail.com',
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'https://www.metoonetwork.xyz/auth/callback?next=%2Fdashboard%3Ftema%3Dduelo',
      },
    })
  })

  it('no deja mandar el enlace a otro dominio', async () => {
    await enviarEnlace('ana@gmail.com', '//malo.com')

    const opciones = (auth.signInWithOtp.mock.calls[0][0] as { options: { emailRedirectTo: string } }).options
    expect(opciones.emailRedirectTo).toBe('https://www.metoonetwork.xyz/auth/callback?next=%2Fdashboard')
  })

  it('rechaza un correo mal escrito sin llamar a Supabase', async () => {
    expect((await enviarEnlace('ana@', null)).error).toBeTruthy()
    expect(auth.signInWithOtp).not.toHaveBeenCalled()
  })

  it('explica el límite de envíos', async () => {
    auth.signInWithOtp.mockResolvedValueOnce({ error: { status: 429, message: 'rate limit' } })
    expect((await enviarEnlace('ana@gmail.com', null)).error).toMatch(/demasiados/)
  })
})

describe('verificarCodigo', () => {
  it('acepta el código con espacios y lo verifica como correo', async () => {
    const res = await verificarCodigo('Ana@gmail.com', '123 456')

    expect(res.success).toBe(true)
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email: 'ana@gmail.com', token: '123456', type: 'email' })
  })

  it('un código incompleto no llega a Supabase', async () => {
    expect((await verificarCodigo('a@b.es', '12')).error).toBeTruthy()
    expect(auth.verifyOtp).not.toHaveBeenCalled()
  })
})
