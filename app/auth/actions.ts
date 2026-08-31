'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function resendConfirmation(): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user?.email) return { error: 'No autenticado' }
  const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
  if (error) {
    console.error('Error resending confirmation email:', error)
    return { error: 'Error al enviar el correo' }
  }
  return { success: true }
}

/**
 * Autenticación desde el servidor.
 *
 * Antes estas tres llamadas se hacían con el cliente de navegador, y eso
 * obligaba a cargar el SDK entero de Supabase —realtime, websockets, storage,
 * edge functions— en la pantalla de login, que es lo primero que ve todo el
 * mundo al abrir la app: 459 KB de JavaScript frente a los 243 KB de una
 * página estática. Aquí no hace falta nada de eso en el navegador.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Email o contraseña incorrectos.' }
  return { success: true }
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ needsVerification?: boolean; success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists')) {
      return { error: 'Ya existe una cuenta con ese email. Prueba a iniciar sesión.' }
    }
    if (msg.includes('password')) {
      return { error: 'La contraseña debe tener al menos 6 caracteres.' }
    }
    return { error: 'Error al crear la cuenta. Inténtalo de nuevo.' }
  }

  // Sin sesión significa que Supabase exige confirmar el correo antes de entrar
  if (!data.session) return { needsVerification: true }
  return { success: true }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // El destino se arma en el servidor a partir de la cabecera de la petición:
  // aceptarlo del cliente permitiría redirigir el enlace del correo a otro
  // dominio.
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const origin = host ? `${proto}://${host}` : ''

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset`,
  })

  if (error) return { error: 'No se pudo enviar el enlace. Comprueba el email.' }
  return { success: true }
}

export async function updatePassword(
  password: string,
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: 'No se pudo actualizar la contraseña. El enlace puede haber caducado.' }
  }
  return { success: true }
}

export async function sendPasswordReset(): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user?.email) return { error: 'No autenticado' }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email)
  if (error) return { error: error.message }
  return { success: true }
}
