'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type SuscripcionPush = { endpoint: string; keys: { p256dh: string; auth: string } }

/** Activa los avisos push en este dispositivo (guarda su suscripción). */
export async function guardarSuscripcion(sub: SuscripcionPush): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  if (!sub?.endpoint?.startsWith('https://') || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { error: 'Suscripción no válida' }
  }

  // Si este navegador ya estaba suscrito (también con otra cuenta), se
  // sustituye: un dispositivo avisa a quien tiene la sesión abierta ahora.
  // Con la clave de servicio porque la fila puede ser de otra cuenta, que la
  // RLS no deja tocar; quien llama demuestra tener el dispositivo al traer su
  // endpoint.
  await createAdminClient().from('push_suscripciones').delete().eq('endpoint', sub.endpoint)
  const { error } = await supabase.from('push_suscripciones').insert({
    profile_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  })
  if (error) {
    console.error('guardarSuscripcion failed:', error)
    return { error: 'No se pudieron activar los avisos.' }
  }
  return { success: true }
}

export async function quitarSuscripcion(endpoint: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase.from('push_suscripciones').delete().eq('endpoint', endpoint).eq('profile_id', user.id)
  if (error) return { error: 'No se pudieron desactivar.' }
  return { success: true }
}
