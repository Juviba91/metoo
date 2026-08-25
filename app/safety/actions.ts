'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const RATE_LIMITS: Record<string, number> = {
  connection_request: 5, // por hora
  message: 50,
  post_create: 20,
}

/**
 * Consume una unidad del rate limit del usuario para `action`.
 * El contador vive en la RPC `check_rate_limit` (SECURITY DEFINER), que hace
 * INSERT ... ON CONFLICT DO UPDATE en una sola sentencia: es atómico y no
 * depende de que el usuario tenga permisos de escritura sobre rate_limits.
 */
export async function checkRateLimit(action: string): Promise<{ allowed: boolean; remaining: number }> {
  const max = RATE_LIMITS[action]
  if (max === undefined) return { allowed: true, remaining: -1 }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('check_rate_limit', { p_action: action, p_max: max })

  if (error) {
    // Si el contador falla no bloqueamos al usuario: se registra y se deja pasar.
    console.error('check_rate_limit failed:', error)
    return { allowed: true, remaining: -1 }
  }

  const row = Array.isArray(data) ? data[0] : data
  return { allowed: row?.allowed ?? true, remaining: row?.remaining ?? -1 }
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
    console.error('Error blocking user:', error)
    return { error: 'Error al bloquear usuario' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/chats')
  revalidatePath(`/dashboard/perfil/${blockedId}`)
  revalidatePath('/dashboard/perfil/blocked')
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

  if (error) {
    console.error('Error unblocking user:', error)
    return { error: 'Error al desbloquear usuario' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/chats')
  revalidatePath(`/dashboard/perfil/${blockedId}`)
  revalidatePath('/dashboard/perfil/blocked')
  return { success: true }
}

/** Usuarios que YO he bloqueado (para la pantalla de gestión). */
export async function getBlockedUsers(): Promise<string[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id)

  if (error) {
    console.error('Error loading blocks:', error)
    return []
  }

  return (data ?? []).map((b) => b.blocked_id as string)
}

/**
 * Ids a ocultar en listados: los que yo bloqueé y los que me bloquearon.
 * Va por RPC para no tener que exponer por RLS quién me ha bloqueado.
 */
export async function getHiddenUserIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('blocked_user_ids')

  if (error) {
    console.error('Error loading blocked ids:', error)
    return []
  }

  return ((data ?? []) as { user_id: string }[]).map((r) => r.user_id)
}

/** ¿He bloqueado yo a este usuario? (estado del botón de bloqueo) */
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

/** ¿Puedo interactuar con este usuario? Comprueba el bloqueo en ambos sentidos. */
export async function canInteractWith(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('is_blocked_with', { p_other: userId })

  if (error) {
    // Ante la duda no se bloquea la interacción, pero queda registrado.
    console.error('is_blocked_with failed:', error)
    return true
  }

  return !data
}

export async function toggleEmailNotifications(
  enabled: boolean,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('profiles')
    .update({ email_notifications_enabled: enabled })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating email preferences:', error)
    return { error: 'Error al actualizar preferencias' }
  }

  revalidatePath('/dashboard/perfil')
  return { success: true }
}
