'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function resendConfirmation(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return
  await supabase.auth.resend({ type: 'signup', email: user.email })
}

export async function sendPasswordReset(): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'No autenticado' }

  const { error } = await supabase.auth.resetPasswordForEmail(user.email)
  if (error) return { error: error.message }
  return { success: true }
}
