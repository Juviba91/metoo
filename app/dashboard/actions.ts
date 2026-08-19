'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptConnection(connectionId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('metoo_connections')
    .update({ status: 'accepted' })
    .eq('id', connectionId)
    .eq('volunteer_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/chats')
}

export async function rejectConnection(connectionId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('metoo_connections')
    .update({ status: 'rejected' })
    .eq('id', connectionId)
    .eq('volunteer_id', user.id)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/chats')
}

export async function requestConnection(volunteerId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { data, error } = await supabase.from('metoo_connections').insert({
    seeker_id: user.id,
    volunteer_id: volunteerId,
    status: 'pending',
  }).select('id').single()

  if (error) return { error: error.message }

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
    .from('metoo_profiles')
    .update({ alias: alias.trim(), city: city.trim(), bio: bio.trim() || null, ...(isActive !== undefined && { is_active: isActive }) })
    .eq('id', user.id)

  if (error) {
    return { error: error.code === '23505' ? 'Ese alias ya está en uso.' : error.message }
  }

  // Sync hashtags: replace all existing with the new selection
  await supabase.from('metoo_profile_hashtags').delete().eq('profile_id', user.id)

  const resolvedIds: string[] = hashtags
    .filter((tag) => !tag.id.startsWith('new:'))
    .map((tag) => tag.id)

  if (resolvedIds.length > 0) {
    await supabase
      .from('metoo_profile_hashtags')
      .insert(resolvedIds.map((id) => ({ profile_id: user.id, hashtag_id: id })))
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
    .from('metoo_connections')
    .select('seeker_id, volunteer_id')
    .eq('id', connectionId)
    .single()

  if (!conn || (conn.seeker_id !== user.id && conn.volunteer_id !== user.id)) {
    return { error: 'No autorizado' }
  }

  await supabase.from('metoo_reports').insert({
    reporter_id: user.id,
    reported_id: reportedId,
    connection_id: connectionId,
    reason,
    description: description?.trim() || null,
  })

  return { success: true }
}

export async function markConnectionRead(connectionId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: conn } = await supabase
    .from('metoo_connections')
    .select('seeker_id, volunteer_id')
    .eq('id', connectionId)
    .single()

  if (!conn) return
  const field = conn.seeker_id === user.id ? 'seeker_last_read_at' : 'volunteer_last_read_at'
  await supabase.from('metoo_connections').update({ [field]: new Date().toISOString() }).eq('id', connectionId)
}

export async function toggleAvailability(isActive: boolean): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('metoo_profiles').update({ is_active: isActive }).eq('id', user.id)
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

  // Auto-accept if the volunteer replies to a pending request
  const { data: conn } = await supabase
    .from('metoo_connections')
    .select('status, volunteer_id, seeker_id')
    .eq('id', connectionId)
    .single()

  if (!conn || (conn.seeker_id !== user.id && conn.volunteer_id !== user.id)) {
    return { error: 'No autorizado' }
  }

  if (conn?.status === 'pending' && conn.volunteer_id === user.id) {
    await supabase
      .from('metoo_connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/chats')
  }

  const { data, error } = await supabase
    .from('metoo_messages')
    .insert({
      connection_id: connectionId,
      sender_id: user.id,
      content: trimmed,
    })
    .select('id, sender_id, content, created_at')
    .single()

  if (error) return { error: error.message }
  return { success: true, message: data }
}
