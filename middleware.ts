import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas que exigen sesión con el email ya confirmado. /feed estaba fuera, así
// que se podía publicar en el feed con un correo sin verificar.
const PROTECTED = ['/dashboard', '/onboarding', '/feed']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (!user && (PROTECTED.some((p) => path.startsWith(p)))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user && !user.email_confirmed_at && (PROTECTED.some((p) => path.startsWith(p)))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/verificar'
    return NextResponse.redirect(url)
  }

  if (user && path === '/auth/login') {
    const url = request.nextUrl.clone()
    url.pathname = user.email_confirmed_at ? '/dashboard' : '/auth/verificar'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
