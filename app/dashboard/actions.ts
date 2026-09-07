'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkRateLimit, canInteractWith } from '@/app/safety/actions'
import { sanitizeModes, sanitizeStage } from '@/lib/profile-fields'

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

  // Solo puede haber una conexión por par (lo garantiza connections_unique_pair).
  const { data: existing } = await supabase
    .from('connections')
    .select('id, status')
    .eq('seeker_id', user.id)
    .eq('volunteer_id', volunteerId)
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
  hashtags: { id: string; slug: string; label: string }[]
  isActive?: boolean
  stage?: string | null
  supportModes?: string[]
}) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({
      alias: alias.trim(),
      city: city.trim(),
      bio: bio.trim() || null,
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
  const resolvedIds: string[] = [
    ...new Set(hashtags.filter((tag) => !tag.id.startsWith('new:')).map((tag) => tag.id)),
  ]

  if (resolvedIds.length > 0) {
    const { error: insertError } = await supabase
      .from('profile_hashtags')
      .upsert(
        resolvedIds.map((id) => ({ profile_id: user.id, hashtag_id: id })),
        { onConflict: 'profile_id,hashtag_id', ignoreDuplicates: true },
      )

    if (insertError) {
      console.error('Error inserting hashtags:', insertError)
      return { error: 'Error al guardar hashtags' }
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
  revalidatePath('/dashboard/perfil')
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
  }
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
    .select('status, volunteer_id, seeker_id')
    .eq('id', connectionId)
    .single()

  if (!conn || (conn.seeker_id !== user.id && conn.volunteer_id !== user.id)) {
    return { error: 'No autorizado' }
  }

  // La UI oculta el campo de texto cuando la conversación está cerrada, pero
  // la RLS de `messages` solo comprueba pertenencia: sin esto, un rechazo se
  // podía saltar llamando a la server action directamente.
  if (conn.status === 'rejected') {
    return { error: 'Esta conversación ha terminado.' }
  }

  // Bloqueo en cualquiera de los dos sentidos
  const otherUserId = conn.seeker_id === user.id ? conn.volunteer_id : conn.seeker_id
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
