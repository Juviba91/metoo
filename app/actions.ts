'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitFeedback(content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('feedback').insert({
    profile_id: user.id,
    content: content.trim(),
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function submitSuggestion(suggestion: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('hashtag_suggestions').insert({
    profile_id: user.id,
    suggestion: suggestion.trim(),
  })

  if (error) return { error: error.message }
  return { success: true }
}
