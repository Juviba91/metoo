/**
 * ¿Tiene esta conversación algo nuevo para mí?
 *
 * Misma regla que `get_unread_count` en la base (que solo da el total para la
 * barra inferior): hay algo sin leer si la otra persona escribió después de la
 * última vez que abrí el chat. Aquí se mira solo el último mensaje: si es mío,
 * ya he contestado y no hace falta avisar. Las rechazadas no cuentan porque no
 * se pueden contestar.
 */
export function conversacionSinLeer(
  conn: {
    status: string
    seeker_id: string
    seeker_last_read_at?: string | null
    volunteer_last_read_at?: string | null
  },
  ultimo: { sender_id: string; created_at: string } | undefined,
  yo: string,
): boolean {
  if (!ultimo || ultimo.sender_id === yo || conn.status === 'rejected') return false
  const leido = conn.seeker_id === yo ? conn.seeker_last_read_at : conn.volunteer_last_read_at
  return !leido || new Date(ultimo.created_at) > new Date(leido)
}
