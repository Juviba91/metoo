'use server'

import { createClient, getUser } from '@/lib/supabase/server'

export async function submitFeedback(content: string) {
  const supabase = await createClient()
  const user = await getUser()
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
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('hashtag_suggestions').insert({
    profile_id: user.id,
    suggestion: suggestion.trim(),
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function createHashtag(
  label: string,
): Promise<{ hashtag?: { id: string; slug: string; label: string }; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const trimmed = label.trim().slice(0, 50)
  if (!trimmed) return { error: 'Hashtag vacío' }

  const slug = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) return { error: 'Hashtag no válido' }

  // Upsert: if slug exists return it, otherwise insert
  const { data, error } = await supabase
    .from('hashtags')
    .upsert({ slug, label: trimmed }, { onConflict: 'slug', ignoreDuplicates: true })
    .select('id, slug, label')
    .single()

  if (error || !data) {
    // Fallback: fetch the existing row if upsert returned no data
    const { data: existing } = await supabase
      .from('hashtags')
      .select('id, slug, label')
      .eq('slug', slug)
      .single()
    if (existing) return { hashtag: existing }
    return { error: error?.message || 'Error al crear hashtag' }
  }

  return { hashtag: data }
}
