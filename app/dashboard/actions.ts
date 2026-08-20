'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkRateLimit, isUserBlocked } from '@/app/safety/actions'

export async function acceptConnection(connectionId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }
  if (user.id === volunteerId) return { error: 'No puedes contactarte a ti mismo' }

  const { allowed } = await checkRateLimit('connection_request')
  if (!allowed) return { error: 'Has alcanzado el límite de solicitudes. Intenta más tarde.' }

  const { data, error } = await supabase.from('connections').insert({
    seeker_id: user.id,
    volunteer_id: volunteerId,
    status: 'pending',
  }).select('id').single()

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
}: {
  alias: string
  city: string
  bio: string
  hashtags: { id: string; slug: string; label: string }[]
  isActive?: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ alias: alias.trim(), city: city.trim(), bio: bio.trim() || null, ...(isActive !== undefined && { is_active: isActive }) })
    .eq('id', user.id)

  if (error) {
    return { error: error.code === '23505' ? 'Ese alias ya está en uso.' : error.message }
  }

  // Sync hashtags: replace all existing with the new selection
  const { error: deleteError } = await supabase.from('profile_hashtags').delete().eq('profile_id', user.id)

  if (deleteError) {
    console.error('Error deleting hashtags:', deleteError)
    return { error: 'Error al actualizar hashtags' }
  }

  const resolvedIds: string[] = hashtags
    .filter((tag) => !tag.id.startsWith('new:'))
    .map((tag) => tag.id)

  if (resolvedIds.length > 0) {
    const { error: insertError } = await supabase
      .from('profile_hashtags')
      .insert(resolvedIds.map((id) => ({ profile_id: user.id, hashtag_id: id })))

    if (insertError) {
      console.error('Error inserting hashtags:', insertError)
      return { error: 'Error al guardar hashtags' }
    }
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: conn } = await supabase
    .from('connections')
    .select('seeker_id, volunteer_id')
    .eq('id', connectionId)
    .single()

  if (!conn) return
  if (conn.seeker_id !== user.id && conn.volunteer_id !== user.id) return
  const field = conn.seeker_id === user.id ? 'seeker_last_read_at' : 'volunteer_last_read_at'

  const { error } = await supabase
    .from('connections')
    .update({ [field]: new Date().toISOString() })
    .eq('id', connectionId)

  if (error) {
    console.error('Error marking connection as read:', error)
  }
}

export async function toggleAvailability(isActive: boolean): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 2000) return { error: 'Mensaje no válido' }

  const { allowed } = await checkRateLimit('message')
  if (!allowed) return { error: 'Has alcanzado el límite de mensajes. Intenta más tarde.' }

  // Auto-accept if the volunteer replies to a pending request
  const { data: conn } = await supabase
    .from('connections')
    .select('status, volunteer_id, seeker_id')
    .eq('id', connectionId)
    .single()

  if (!conn || (conn.seeker_id !== user.id && conn.volunteer_id !== user.id)) {
    return { error: 'No autorizado' }
  }

  // Check if either user has blocked the other
  const otherUserId = conn.seeker_id === user.id ? conn.volunteer_id : conn.seeker_id
  const isBlocked = await isUserBlocked(otherUserId)
  if (isBlocked) {
    return { error: 'No puedes enviar mensajes a este usuario' }
  }

  // Check if the other user has blocked you
  const { data: blockByOther } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', otherUserId)
    .eq('blocked_id', user.id)
    .maybeSingle()

  if (blockByOther) {
    return { error: 'No puedes enviar mensajes a este usuario' }
  }

  if (conn?.status === 'pending' && conn.volunteer_id === user.id) {
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
  return { success: true, message: data }
}
