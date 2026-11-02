import { describe, it, expect, vi, beforeEach } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const auth = { verifyOtp: vi.fn(async (_: unknown) => ({ error: null as null | { message: string } })) }
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth }) }))
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT ${url}`)
})
vi.mock('next/navigation', () => ({ redirect: (u: string) => redirect(u) }))

const { entrarConEnlace } = await import('@/app/auth/confirm/actions')
const { destinoDelEnlace } = await import('@/lib/enlace-correo')

const form = (campos: Record<string, string>) => {
  const f = new FormData()
  for (const [k, v] of Object.entries(campos)) f.set(k, v)
  return f
}
const destino = async (f: FormData) => {
  try {
    await entrarConEnlace(f)
  } catch (e) {
    return (e as Error).message.replace('REDIRECT ', '')
  }
  return null
}

beforeEach(() => vi.clearAllMocks())

describe('el enlace del correo', () => {
  // Los correos de empresa abren cada enlace para comprobarlo (Bankinter lo
  // hizo a los 5 s) y, si eso basta para gastarlo, a la persona le llega
  // caducado. Abrirlo solo pinta un botón.
  it('no se gasta al abrirlo: no hay GET que llame a verifyOtp', () => {
    const dir = join(process.cwd(), 'app', 'auth', 'confirm')
    expect(existsSync(join(dir, 'route.ts'))).toBe(false)
    expect(readFileSync(join(dir, 'page.tsx'), 'utf8')).not.toMatch(/verifyOtp/)
  })

  it('al pulsar «Entrar» se gasta y vuelve a donde iba', async () => {
    const r = await destino(
      form({
        token_hash: 'abc',
        type: 'email',
        redirect_to: 'https://www.metoonetwork.xyz/auth/callback?next=%2Fonboarding%3Frol%3Dseeker',
      }),
    )
    expect(auth.verifyOtp).toHaveBeenCalledWith({ type: 'email', token_hash: 'abc' })
    expect(r).toBe('/onboarding?rol=seeker')
  })

  it('si está caducado, al login con el aviso', async () => {
    auth.verifyOtp.mockResolvedValueOnce({ error: { message: 'expired' } })
    expect(await destino(form({ token_hash: 'abc', type: 'email' }))).toBe('/auth/login?error=enlace')
  })

  it('no deja salir a otro dominio', () => {
    expect(destinoDelEnlace('https://www.metoonetwork.xyz/auth/callback?next=%2F%2Fmalo.com')).toBe('/dashboard')
    expect(destinoDelEnlace('')).toBe('/dashboard')
    expect(destinoDelEnlace('no es una url ::')).toBe('/dashboard')
  })
})
