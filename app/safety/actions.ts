'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const RATE_LIMITS = {
  connection_request: { max: 5, window: 3600 }, // 5 per hour
  message: { max: 50, window: 3600 }, // 50 per hour
  post_create: { max: 20, window: 3600 }, // 20 per hour
}

export async function checkRateLimit(action: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, remaining: 0 }

  const limit = RATE_LIMITS[action as keyof typeof RATE_LIMITS]
  if (!limit) return { allowed: true, remaining: -1 }

  const now = new Date()
  const windowStart = new Date(now.getTime() - limit.window * 1000)

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('user_id', user.id)
    .eq('action', action)
    .gte('window_start', windowStart.toISOString())
    .lt('window_start', now.toISOString())
    .single()

  if (existing && existing.count >= limit.max) {
    return { allowed: false, remaining: 0 }
  }

  const count = (existing?.count ?? 0) + 1
  if (existing) {
    await supabase
      .from('rate_limits')
      .update({ count })
      .eq('user_id', user.id)
      .eq('action', action)
  } else {
    await supabase
      .from('rate_limits')
      .insert({
        user_id: user.id,
        action,
        count: 1,
        window_start: windowStart.toISOString(),
      })
  }

  return { allowed: true, remaining: Math.max(0, limit.max - count) }
}

export async function blockUser(blockedId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  if (user.id === blockedId) return { error: 'No puedes bloquearte a ti mismo' }

  const { error } = await supabase.from('blocks').insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Este usuario ya está bloqueado' }
    return { error: 'Error al bloquear usuario' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function unblockUser(blockedId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId)

  if (error) return { error: 'Error al desbloquear usuario' }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getBlockedUsers(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id)

  return data?.map(b => b.blocked_id) ?? []
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('blocks')
    .select('id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', userId)
    .maybeSingle()

  return !!data
}

export async function queueEmail(
  recipientEmail: string,
  subject: string,
  htmlBody: string,
  fromEmail?: string,
  userId?: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // Check if user has disabled email notifications
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_notifications_enabled')
      .eq('id', userId)
      .single()

    if (profile && !profile.email_notifications_enabled) {
      return { success: true } // Silently skip if notifications disabled
    }
  }

  const { error } = await supabase.from('email_queue').insert({
    recipient_email: recipientEmail,
    subject,
    html_body: htmlBody,
    from_email: fromEmail,
  })

  if (error) {
    console.error('Error queueing email:', error)
    return { error: 'Error al enviar email' }
  }

  return { success: true }
}

export async function toggleEmailNotifications(enabled: boolean): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ email_notifications_enabled: enabled })
    .eq('id', user.id)

  if (error) {
    return { error: 'Error al actualizar preferencias' }
  }

  return { success: true }
}
