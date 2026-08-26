'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

export async function sendPasswordReset(): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user?.email) return { error: 'No autenticado' }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email)
  if (error) return { error: error.message }
  return { success: true }
}
