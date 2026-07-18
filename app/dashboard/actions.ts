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
    .from('connections')
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
    .from('connections')
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

  const { error } = await supabase.from('connections').insert({
    seeker_id: user.id,
    volunteer_id: volunteerId,
    status: 'pending',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
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
  await supabase.from('profile_hashtags').delete().eq('profile_id', user.id)

  const resolvedIds: string[] = []
  for (const tag of hashtags) {
    if (tag.id.startsWith('new:')) {
      const { data } = await supabase
        .from('hashtags')
        .upsert({ slug: tag.slug, label: tag.label }, { onConflict: 'slug' })
        .select('id')
        .single()
      if (data) resolvedIds.push(data.id)
    } else {
      resolvedIds.push(tag.id)
    }
  }

  if (resolvedIds.length > 0) {
    await supabase
      .from('profile_hashtags')
      .insert(resolvedIds.map((id) => ({ profile_id: user.id, hashtag_id: id })))
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/perfil')
  return { success: true }
}

export async function toggleAvailability(isActive: boolean): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').update({ is_active: isActive }).eq('id', user.id)
  revalidatePath('/dashboard')
}

export async function sendMessage(connectionId: string, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  // Auto-accept if the volunteer replies to a pending request
  const { data: conn } = await supabase
    .from('connections')
    .select('status, volunteer_id')
    .eq('id', connectionId)
    .single()

  if (conn?.status === 'pending' && conn.volunteer_id === user.id) {
    await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', connectionId)
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/chats')
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      connection_id: connectionId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select('id, sender_id, content, created_at')
    .single()

  if (error) return { error: error.message }
  return { success: true, message: data }
}
