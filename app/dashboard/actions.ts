'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function sendMessage(connectionId: string, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('messages').insert({
    connection_id: connectionId,
    sender_id: user.id,
    content: content.trim(),
  })

  if (error) return { error: error.message }
  return { success: true }
}
