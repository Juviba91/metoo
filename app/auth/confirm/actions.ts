'use server'

import { redirect } from 'next/navigation'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { destinoDelEnlace } from '@/lib/enlace-correo'

/**
 * Gasta el enlace del correo y abre la sesión. Solo al pulsar «Entrar»: ver
 * page.tsx para el porqué.
 */
export async function entrarConEnlace(formData: FormData) {
  const tokenHash = String(formData.get('token_hash') ?? '')
  const type = (String(formData.get('type') ?? '') || 'email') as EmailOtpType
  const next = destinoDelEnlace(String(formData.get('redirect_to') ?? ''))

  if (!tokenHash) redirect('/auth/login?error=enlace')

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) redirect('/auth/login?error=enlace')
  redirect(next)
}
