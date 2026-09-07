/**
 * Comprueba si hay un bloqueo entre dos personas, en cualquiera de los dos
 * sentidos.
 *
 * Las server actions ya impiden escribir o solicitar a alguien bloqueado, pero
 * los webhooks se disparan ante cualquier INSERT/UPDATE de la tabla: si el
 * bloqueo llega entre medias, esto es lo que evita que salga el correo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (table: string) => any }

export async function hayBloqueo(
  supabase: SupabaseLike,
  unUsuario: string,
  otroUsuario: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${unUsuario},blocked_id.eq.${otroUsuario}),` +
        `and(blocker_id.eq.${otroUsuario},blocked_id.eq.${unUsuario})`,
    )
    .maybeSingle()

  return Boolean(data)
}
