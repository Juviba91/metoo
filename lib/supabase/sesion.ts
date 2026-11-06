import type { SupabaseClient } from '@supabase/supabase-js'

/** Lo que la app usa de la cuenta con sesión. */
export type UsuarioSesion = {
  id: string
  email: string | undefined
  email_confirmed_at: string | null
}

/**
 * Quién tiene la sesión abierta, sin preguntar a Supabase por la red si se
 * puede evitar.
 *
 * `auth.getUser()` valida el token contra el servidor de Supabase Auth en
 * Virginia en cada llamada, y cada navegación lo hacía dos veces (middleware y
 * página). Con las claves JWT asimétricas (activadas en octubre de 2026),
 * `getClaims()` comprueba la firma aquí mismo con la clave pública del
 * proyecto, que se descarga una vez y queda en memoria. Si el token aún está
 * firmado con el secreto antiguo, `getClaims()` vuelve solo a la llamada de
 * red: nunca es menos seguro que antes.
 *
 * El token no dice cuándo se confirmó el correo. Sí lleva
 * `user_metadata.email_verified`; si es `true` basta. Si no lo es (o no viene),
 * se pregunta a Supabase como antes, para no dejar entrar a nadie sin
 * confirmar por un dato que falte.
 */
export async function usuarioDeLaSesion(
  supabase: SupabaseClient<any, any, any>,
): Promise<UsuarioSesion | null> {
  return (await sesionDe(supabase)).usuario
}

/**
 * ¿El error dice que la sesión guardada en el navegador ya no sirve?
 *
 * Pasa cuando el token de renovación no existe (se cerró la sesión en otro
 * sitio, se rotó la clave, la cuenta se borró…). Es distinto de «no hay
 * sesión»: aquí el navegador sigue mandando una cookie que no vale.
 */
export function sesionCaducada(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null | undefined
  if (!e) return false
  if (['refresh_token_not_found', 'refresh_token_already_used', 'session_not_found'].includes(e.code ?? '')) {
    return true
  }
  return /Invalid Refresh Token|Refresh Token Not Found/i.test(e.message ?? '')
}

/** Las cookies de sesión de Supabase (también las partidas en trozos: `.0`, `.1`…). */
export function cookiesDeSesion(nombres: string[]): string[] {
  return nombres.filter((n) => /^sb-.+-auth-token(\.\d+)?$/.test(n))
}

/**
 * Lo mismo que `usuarioDeLaSesion`, y además si la cookie que llegó ya no vale.
 * El middleware lo usa para borrarla: sin eso, ese navegador reintentaba la
 * renovación (y fallaba, y lo registraba) en cada carga.
 */
export async function sesionDe(
  supabase: SupabaseClient<any, any, any>,
): Promise<{ usuario: UsuarioSesion | null; caducada: boolean }> {
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error) return { usuario: null, caducada: sesionCaducada(error) }
  if (!claims?.sub) return { usuario: null, caducada: false }

  const metadatos = (claims.user_metadata ?? {}) as { email_verified?: unknown }
  if (metadatos.email_verified === true) {
    return {
      usuario: {
        id: claims.sub,
        email: typeof claims.email === 'string' ? claims.email : undefined,
        // No es la fecha real (el token no la lleva): solo marca que está confirmado.
        email_confirmed_at: new Date((claims.iat ?? 0) * 1000).toISOString(),
      },
      caducada: false,
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { usuario: null, caducada: false }
  return {
    usuario: { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at ?? null },
    caducada: false,
  }
}
