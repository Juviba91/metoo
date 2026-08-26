import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {}
        },
      },
    },
  )
}

/**
 * `auth.getUser()` no lee la cookie sin más: valida el token contra el
 * servidor de Supabase Auth en cada llamada (a propósito, es lo que la hace
 * segura frente a `getSession()`). Sin memoizar, una sola navegación repetía
 * esa validación de red 3 o 4 veces — middleware, SiteHeader, la propia
 * página y alguna comprobación de bloqueo — y esa cascada de round-trips es
 * lo que hacía que cada cambio de página se notara lento.
 *
 * `cache()` de React memoiza por petición: aunque `getUser()` se llame varias
 * veces durante el mismo render (server component o server action), solo la
 * primera hace la llamada real; el resto reutiliza esa misma promesa. No
 * dedupe con la llamada que hace el middleware, que corre en un runtime aparte
 * antes de que empiece el render.
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
