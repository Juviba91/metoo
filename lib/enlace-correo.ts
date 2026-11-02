import { destinoSeguro } from '@/lib/destino'

/**
 * A dónde ir tras entrar con el enlace del correo. `redirect_to` es la URL que
 * pidió la app (…/auth/callback?next=…); de ella solo se usa su `next`, y
 * pasa por destinoSeguro (solo rutas internas).
 */
export function destinoDelEnlace(redirectTo: string | null | undefined): string {
  if (!redirectTo) return '/dashboard'
  try {
    return destinoSeguro(new URL(redirectTo, 'https://x.invalid').searchParams.get('next'))
  } catch {
    return '/dashboard'
  }
}
