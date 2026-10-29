import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { destinoSeguro } from '@/lib/destino'
import { usuarioDeLaSesion } from '@/lib/supabase/sesion'
import {
  COOKIE_CONSENTIMIENTO,
  consentimientoAlDia,
  valorCookieConsentimiento,
} from '@/lib/legal'

/**
 * Node.js en vez del edge, a propósito.
 *
 * En el edge esto se ejecuta en el nodo más cercano al usuario. El 78 % de
 * quienes usan metoo están en España, y Supabase vive en us-east-1: cada
 * navegación pagaba un viaje transatlántico solo para validar la sesión, y
 * encima antes de que la página empezara a renderizarse (Madrid → Virginia →
 * Madrid → Virginia otra vez para la función).
 *
 * En Node.js corre en la región de las funciones, la misma que la base de
 * datos, así que esa comprobación pasa a ser un salto local.
 */
export const runtime = 'nodejs'

// Rutas que exigen sesión con el email ya confirmado. /feed estaba fuera, así
// que se podía publicar en el feed con un correo sin verificar.
const PROTECTED = ['/dashboard', '/onboarding', '/feed']

// Donde hace falta el consentimiento al día (ver más abajo). Ajustes queda
// fuera para que quien no quiera aceptar pueda darse de baja.
const CON_CONSENTIMIENTO = ['/dashboard', '/feed']
const SIN_CONSENTIMIENTO = ['/dashboard/consentimiento', '/dashboard/ajustes']

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

  // Comprueba la firma del token aquí, sin ir a Supabase (claves
  // asimétricas); de paso renueva la sesión si ha caducado. Ver lib/supabase/sesion.ts.
  const user = await usuarioDeLaSesion(supabase)

  const path = request.nextUrl.pathname

  if (!user && (PROTECTED.some((p) => path.startsWith(p)))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Se recuerda a dónde ibas, con sus parámetros, para volver tras entrar.
    url.search = ''
    url.searchParams.set('next', path + request.nextUrl.search)
    return NextResponse.redirect(url)
  }

  if (user && !user.email_confirmed_at && (PROTECTED.some((p) => path.startsWith(p)))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/verificar'
    return NextResponse.redirect(url)
  }

  // Consentimiento al día. Las cuentas de antes de la casilla de salud y de la
  // fecha de nacimiento, y todas cuando cambian los textos de fondo
  // (VERSION_TEXTOS_LEGALES), pasan por /dashboard/consentimiento antes de
  // seguir. El consentimiento no es retroactivo ni tácito: hay que darlo.
  //
  // La consulta solo se hace mientras no esté la cookie, que se pone en cuanto
  // la base dice que está todo: una vez por cuenta y versión, no por navegación.
  // Si la consulta falla (p. ej. columnas aún sin migrar) se deja pasar: mejor
  // eso que encerrar a todo el mundo en un bucle.
  if (
    user?.email_confirmed_at &&
    CON_CONSENTIMIENTO.some((p) => path.startsWith(p)) &&
    !SIN_CONSENTIMIENTO.some((p) => path.startsWith(p)) &&
    request.cookies.get(COOKIE_CONSENTIMIENTO)?.value !== valorCookieConsentimiento(user.id)
  ) {
    const { data: registro } = await supabase
      .from('profiles')
      .select('consentimiento_version, consentimiento_salud_en, edad_comprobada_en')
      .eq('id', user.id)
      .maybeSingle()

    if (registro && !consentimientoAlDia(registro)) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard/consentimiento'
      url.search = ''
      url.searchParams.set('next', path + request.nextUrl.search)
      return NextResponse.redirect(url)
    }

    if (registro) {
      supabaseResponse.cookies.set(COOKIE_CONSENTIMIENTO, valorCookieConsentimiento(user.id), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24 * 365,
      })
    }
  }

  if (user && path === '/auth/login') {
    const url = request.nextUrl.clone()
    const destino = destinoSeguro(request.nextUrl.searchParams.get('next'))
    url.search = ''
    if (user.email_confirmed_at) {
      // `destino` puede traer su propia query (?tema=…): se separa para no
      // meter un «?» dentro del pathname.
      const [ruta, query] = destino.split('?')
      url.pathname = ruta
      url.search = query ? `?${query}` : ''
    } else {
      url.pathname = '/auth/verificar'
    }
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
