import { describe, it, expect, vi } from 'vitest'
import { usuarioDeLaSesion } from '@/lib/supabase/sesion'

function cliente(claims: Record<string, unknown> | null, user: Record<string, unknown> | null = null) {
  const getUser = vi.fn(async () => ({ data: { user } }))
  const getClaims = vi.fn(async () => ({ data: claims ? { claims } : null, error: null }))
  return { client: { auth: { getUser, getClaims } } as never, getUser }
}

describe('usuarioDeLaSesion', () => {
  it('con el correo verificado en el token, no sale a la red', async () => {
    const { client, getUser } = cliente({
      sub: 'u1',
      email: 'ana@gmail.com',
      iat: 1_800_000_000,
      user_metadata: { email_verified: true },
    })

    const u = await usuarioDeLaSesion(client)

    expect(u).toMatchObject({ id: 'u1', email: 'ana@gmail.com' })
    expect(u?.email_confirmed_at).toBeTruthy()
    expect(getUser).not.toHaveBeenCalled()
  })

  it('si el token no dice que está verificado, pregunta a Supabase como antes', async () => {
    const { client, getUser } = cliente(
      { sub: 'u1', email: 'ana@gmail.com', user_metadata: { email_verified: false } },
      { id: 'u1', email: 'ana@gmail.com', email_confirmed_at: null },
    )

    const u = await usuarioDeLaSesion(client)

    expect(getUser).toHaveBeenCalledOnce()
    expect(u).toEqual({ id: 'u1', email: 'ana@gmail.com', email_confirmed_at: null })
  })

  it('sin sesión válida devuelve null', async () => {
    const { client, getUser } = cliente(null)

    expect(await usuarioDeLaSesion(client)).toBeNull()
    expect(getUser).not.toHaveBeenCalled()
  })
})
