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

// `auth.getUser()` valida el token contra el servidor de Supabase Auth en cada
// llamada, así que el middleware costaba una ida y vuelta de red en CADA
// petición: también en la portada, los textos legales, el manifest, los iconos
// y —lo que más se nota— en los prefetch que Next lanza al ver un enlace.
// Aquí solo se listan las rutas que de verdad dependen de la sesión: las
// protegidas y el login (que redirige si ya has entrado). El resto se sirve sin
// tocar la red. La sesión se sigue refrescando en las pantallas de la app, que
// es donde importa.
export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/feed/:path*', '/auth/login'],
}
