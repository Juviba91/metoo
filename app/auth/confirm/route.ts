import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { destinoSeguro } from '@/lib/destino'

/**
 * Entrar desde el enlace del correo con `token_hash`.
 *
 * El enlace por defecto de Supabase usa PKCE: solo funciona si se abre en el
 * mismo navegador donde se pidió. En el móvil muchas veces se abre dentro de
 * la app de Gmail y falla. Con la plantilla de correo apuntando aquí
 * (`/auth/confirm?token_hash=…&type=email`) funciona en cualquier navegador.
 * `redirect_to` es la URL que pidió la app; de ella solo se usa su `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = (searchParams.get('type') ?? 'email') as EmailOtpType

  let next = '/dashboard'
  try {
    const pedida = searchParams.get('redirect_to')
    if (pedida) next = destinoSeguro(new URL(pedida, origin).searchParams.get('next'))
  } catch {}

  if (tokenHash) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=enlace`)
}
