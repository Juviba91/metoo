'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkRateLimit, canInteractWith } from '@/app/safety/actions'
import { sanitizeModes, sanitizeStage, validarTextos } from '@/lib/profile-fields'
import { ladosDe, puedeIniciar, type Rol } from '@/lib/lados'

export async function acceptConnection(connectionId: string): Promise<void> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return

  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted' })
    .eq('id', connectionId)
    .eq('volunteer_id', user.id)

  if (error) {
    console.error('Error accepting connection:', error)
    return
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/chats')
}

export async function rejectConnection(connectionId: string): Promise<void> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return

  const { error } = await supabase
    .from('connections')
    .update({ status: 'rejected' })
    .eq('id', connectionId)
    .eq('volunteer_id', user.id)

  if (error) {
    console.error('Error rejecting connection:', error)
    return
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/chats')
}

export async function requestConnection(volunteerId: string) {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) return { error: 'No autenticado' }
  if (user.id === volunteerId) return { error: 'No puedes contactarte a ti mismo' }

  if (!(await canInteractWith(volunteerId))) {
    return { error: 'No puedes contactar con este usuario' }
  }

  // Una sola consulta para las dos fichas. De quien se da de baja la ficha se
  // conserva como lápida para no romperle la conversación a nadie, pero no se le
  // puede empezar una nueva: en los listados no sale (queda `is_active = false`)
  // y esto cubre la llamada directa.
  //
  // Los lados también se comprueban aquí. Hasta ahora «quien busca inicia, quien
  // acompaña acepta» lo imponía solo la interfaz, y a una server action se la
  // puede llamar directa: cualquiera podía escribir a cualquiera. Con cuentas a
  // los dos lados la regla se decide por los temas de cada una, no por su papel
  // de registro.
  const { data: fichas } = await supabase
    .from('profiles')
    .select('id, role, deleted_at, profile_hashtags(role)')
    .in('id', [user.id, volunteerId])

  const destino = fichas?.find((f) => f.id === volunteerId)
  const yo = fichas?.find((f) => f.id === user.id)

  if (!destino || destino.deleted_at) {
    return { error: 'Esta persona ya no está en metoo.' }
  }
  if (
    !yo ||
    !puedeIniciar(ladosDe(yo.role, yo.profile_hashtags), ladosDe(destino.role, destino.profile_hashtags))
  ) {
    return { error: 'No puedes contactar con este usuario' }
  }

  // Solo puede haber una conversación por pareja, en el sentido que sea. La
  // restricción de la base (connections_unique_pair) es direccional: sin mirar
  // los dos sentidos, A podía pedirle a B mientras B ya le había pedido a A, y
  // acababan con dos conversaciones abiertas entre los mismos. Como las dos
  // columnas no pueden ser la misma persona (connections_check), filtrar con
  // `in` en las dos devuelve exactamente las de esta pareja.
  const { data: existing } = await supabase
    .from('connections')
    .select('id, status')
    .in('seeker_id', [user.id, volunteerId])
    .in('volunteer_id', [user.id, volunteerId])
    .limit(1)
    .maybeSingle()

  if (existing) {
    // Un rechazo se respeta: no se vuelve a solicitar ni se avisa de nuevo al
    // voluntario. El mensaje es neutro a propósito, para no señalar a nadie.
    if (existing.status === 'rejected') {
      return { error: 'Esta persona no está disponible ahora mismo.' }
    }
    // Ya había una solicitud en curso: se devuelve, sin duplicar ni renotificar
    return { success: true, connectionId: existing.id as string }
  }

  const { allowed } = await checkRateLimit('connection_request')
  if (!allowed) return { error: 'Has alcanzado el límite de solicitudes. Intenta más tarde.' }

  const { data, error } = await supabase.from('connections').insert({
    seeker_id: user.id,
    volunteer_id: volunteerId,
    status: 'pending',
  }).select('id').single()

  // 23505: otra petición simultánea ganó la carrera y ya creó la conexión
  if (error?.code === '23505') {
    const { data: raced } = await supabase
      .from('connections')
      .select('id')
      .eq('seeker_id', user.id)
      .eq('volunteer_id', volunteerId)
      .maybeSingle()

    if (raced) return { success: true, connectionId: raced.id as string }
  }

  if (error || !data) return { error: error?.message || 'Error al enviar solicitud' }

  revalidatePath('/dashboard')
  return { success: true, connectionId: data.id as string }
}

export async function updateProfile({
  alias,
  city,
  bio,
  hashtags,
  isActive,
  stage,
  supportModes,
}: {
  alias: string
  city: string
  bio: string
  /** `role`: de qué lado estás en ese tema. Sin él se deja el que ya tuviera. */
  hashtags: { id: string; slug: string; label: string; role?: string }[]
  isActive?: boolean
  stage?: string | null
  supportModes?: string[]
}) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const textos = validarTextos({ alias, city, bio })
  if (!textos.ok) return { error: textos.error }

  const { error } = await supabase
    .from('profiles')
    .update({
      alias: textos.valores.alias,
      city: textos.valores.city,
      bio: textos.valores.bio,
      // Se validan contra el vocabulario en vez de confiar en el cliente: la
      // restricción CHECK de la tabla rechazaría lo inventado, pero con un
      // error de base de datos en vez de un guardado limpio.
      stage: sanitizeStage(stage),
      support_modes: sanitizeModes(supportModes),
      ...(isActive !== undefined && { is_active: isActive }),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.code === '23505' ? 'Ese alias ya está en uso.' : error.message }
  }

  // Sync de hashtags. Antes se borraban todos y luego se insertaban los
  // nuevos: si el insert fallaba, el usuario se quedaba sin ninguno. Ahora se
  // añaden primero y se borra solo lo que sobra, así el peor caso es no
  // guardar el cambio en vez de perder lo que ya había.
  // Por id, con el último papel indicado si un tema llega repetido. Lo que no es
  // exactamente 'seeker' o 'volunteer' se descarta aquí y no se manda a la base:
  // el CHECK lo rechazaría, pero con un error de base de datos en vez de un
  // guardado limpio.
  const rolDeCada = new Map<string, Rol | undefined>()
  for (const tag of hashtags) {
    if (tag.id.startsWith('new:')) continue
    rolDeCada.set(tag.id, tag.role === 'seeker' || tag.role === 'volunteer' ? tag.role : undefined)
  }
  const resolvedIds: string[] = [...rolDeCada.keys()]

  if (resolvedIds.length > 0) {
    // Los que traen papel se escriben con él, actualizando si ya existían. Los
    // que no, solo se añaden y NO se tocan si ya estaban: una pestaña abierta
    // con el código de antes no manda el papel, y si se escribiera igualmente
    // pisaría el que se hubiera elegido. Dos llamadas, pero una sola en el caso
    // normal.
    const conRol = resolvedIds.filter((id) => rolDeCada.get(id))
    const sinRol = resolvedIds.filter((id) => !rolDeCada.get(id))

    if (conRol.length > 0) {
      const { error: insertError } = await supabase.from('profile_hashtags').upsert(
        conRol.map((id) => ({ profile_id: user.id, hashtag_id: id, role: rolDeCada.get(id) as Rol })),
        { onConflict: 'profile_id,hashtag_id' },
      )

      if (insertError) {
        console.error('Error inserting hashtags:', insertError)
        return { error: 'Error al guardar hashtags' }
      }
    }

    if (sinRol.length > 0) {
      const { error: insertError } = await supabase
        .from('profile_hashtags')
        .upsert(
          sinRol.map((id) => ({ profile_id: user.id, hashtag_id: id })),
          { onConflict: 'profile_id,hashtag_id', ignoreDuplicates: true },
        )

      if (insertError) {
        console.error('Error inserting hashtags:', insertError)
        return { error: 'Error al guardar hashtags' }
      }
    }
  }

  let deleteQuery = supabase.from('profile_hashtags').delete().eq('profile_id', user.id)
  if (resolvedIds.length > 0) {
    deleteQuery = deleteQuery.not('hashtag_id', 'in', `(${resolvedIds.join(',')})`)
  }
  const { error: deleteError } = await deleteQuery

  if (deleteError) {
    console.error('Error deleting hashtags:', deleteError)
    return { error: 'Error al actualizar hashtags' }
  }

  revalidatePath('/dashboard')
  // 'layout' para que entren también /dashboard/perfil/editar y el resto de
  // subrutas: si no, al volver a editar salía lo de antes de guardar.
  revalidatePath('/dashboard/perfil', 'layout')
  return { success: true }
}

export async function reportUser(
  reportedId: string,
  connectionId: string,
  reason: string,
  description?: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: conn } = await supabase
    .from('connections')
    .select('seeker_id, volunteer_id')
    .eq('id', connectionId)
    .single()

  if (!conn || (conn.seeker_id !== user.id && conn.volunteer_id !== user.id)) {
    return { error: 'No autorizado' }
  }

  const { error: reportError } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id: reportedId,
    connection_id: connectionId,
    reason,
    description: description?.trim() || null,
  })

  if (reportError) {
    console.error('Error creating report:', reportError)
    return { error: 'Error al crear el reporte' }
  }

  return { success: true }
}

export async function markConnectionRead(connectionId: string): Promise<void> {
  const supabase = await createClient()

  // Via RPC: la política UPDATE de `connections` solo permite escribir al
  // voluntario, así que un seeker nunca podía marcar su propia conversación
  // como leída. La función valida pertenencia y actualiza el campo correcto.
  const { error } = await supabase.rpc('mark_connection_read', { p_connection_id: connectionId })

  if (error) {
    console.error('Error marking connection as read:', error)
    return
  }

  // El globo de la barra inferior lo pinta cada pestaña en el servidor. Sin
  // esto, marcar como leído solo cambiaba la base de datos: al volver atrás
  // seguías viendo el aviso de un mensaje que acabas de leer, porque la página
  // venía de la caché del router (`staleTimes.dynamic` está a 30 s).
  //
  // Se revalidan las cuatro pestañas, pero NO la ruta del chat: `ChatView`
  // arranca su estado con `useState(initialMessages)` y los mensajes en vivo
  // los lleva él, así que volver a renderizarla desde el servidor mientras
  // estás dentro no aporta nada y puede pisar lo que ya se ve.
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/chats')
  revalidatePath('/dashboard/perfil')
  revalidatePath('/feed')
}

export async function toggleAvailability(isActive: boolean): Promise<void> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return

  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', user.id)

  if (error) {
    console.error('Error updating availability:', error)
    return
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/perfil', 'layout')
}

export async function sendMessage(connectionId: string, content: string) {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) return { error: 'No autenticado' }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 2000) return { error: 'Mensaje no válido' }

  // Auto-accept if the volunteer replies to a pending request
  const { data: conn } = await supabase
    .from('connections')
    // El embed va con el nombre de la clave ajena, no con el de la columna:
    // `connections` apunta dos veces a `profiles` y sin la pista ni PostgREST
    // ni los tipos generados saben por cuál de las dos entrar.
    .select(
      'status, volunteer_id, seeker_id, seeker:profiles!connections_seeker_id_fkey(deleted_at), volunteer:profiles!connections_volunteer_id_fkey(deleted_at)',
    )
    .eq('id', connectionId)
    .single()

  if (!conn || (conn.seeker_id !== user.id && conn.volunteer_id !== user.id)) {
    return { error: 'No autorizado' }
  }

  // La conversación se conserva cuando la otra persona se da de baja, pero es
  // solo para leerla. La UI esconde el campo de texto; esto es lo que de
  // verdad lo impide, porque a una server action se la puede llamar directa.
  const soyElSeeker = conn.seeker_id === user.id
  const otraFicha = (soyElSeeker ? conn.volunteer : conn.seeker) as
    | { deleted_at: string | null }
    | null
  if (otraFicha?.deleted_at) {
    return { error: 'Esta persona ya no está en metoo.' }
  }

  // La UI oculta el campo de texto cuando la conversación está cerrada, pero
  // la RLS de `messages` solo comprueba pertenencia: sin esto, un rechazo se
  // podía saltar llamando a la server action directamente.
  if (conn.status === 'rejected') {
    return { error: 'Esta conversación ha terminado.' }
  }

  // Bloqueo en cualquiera de los dos sentidos
  const otherUserId = soyElSeeker ? conn.volunteer_id : conn.seeker_id
  if (!(await canInteractWith(otherUserId))) {
    return { error: 'No puedes enviar mensajes a este usuario' }
  }

  // El rate limit se consume una vez la petición ya es válida y autorizada
  const { allowed } = await checkRateLimit('message')
  if (!allowed) return { error: 'Has alcanzado el límite de mensajes. Intenta más tarde.' }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      connection_id: connectionId,
      sender_id: user.id,
      content: trimmed,
    })
    .select('id, sender_id, content, created_at')
    .single()

  if (error || !data) return { error: error?.message || 'Error al enviar el mensaje' }

  // Se acepta DESPUÉS de insertar el mensaje, no antes. El webhook de
  // `connections` avisa por correo de que han aceptado, y comprueba si el
  // voluntario ya ha escrito para no mandar dos correos por lo mismo: si el
  // UPDATE fuese primero, ese mensaje aún no existiría y el aviso se duplicaría.
  if (conn.status === 'pending' && conn.volunteer_id === user.id) {
    const { error: updateError } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)

    if (updateError) {
      console.error('Error auto-accepting connection:', updateError)
    } else {
      revalidatePath('/dashboard')
      revalidatePath('/dashboard/chats')
    }
  }

  return { success: true, message: data }
}
