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
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (error || !claims?.sub) return null

  const metadatos = (claims.user_metadata ?? {}) as { email_verified?: unknown }
  if (metadatos.email_verified === true) {
    return {
      id: claims.sub,
      email: typeof claims.email === 'string' ? claims.email : undefined,
      // No es la fecha real (el token no la lleva): solo marca que está confirmado.
      email_confirmed_at: new Date((claims.iat ?? 0) * 1000).toISOString(),
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  return { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at ?? null }
}
