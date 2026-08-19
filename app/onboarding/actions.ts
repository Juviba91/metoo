'use server'

import { createClient } from '@/lib/supabase/server'

export type HashtagInput = { id: string; slug: string; label: string }

const CATEGORY_SLUGS = [
  'ucin',
  'prematuro-extremo',
  'prematuro-tardio',
  'secuelas',
  'perdida-neonatal',
  'gemelos-prematuros',
]

export async function completeOnboarding({
  role,
  hashtags,
  alias,
  city,
  bio,
}: {
  role: 'seeker' | 'volunteer'
  hashtags: HashtagInput[]
  alias: string
  city: string
  bio: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { error: profileError } = await supabase.from('metoo_profiles').insert({
    id: user.id,
    alias: alias.trim(),
    role,
    city: city.trim(),
    country: 'ES',
    bio: bio.trim() || null,
  })

  if (profileError) {
    return {
      error:
        profileError.code === '23505'
          ? 'Ese alias ya está en uso, prueba con otro.'
          : 'Error al guardar el perfil. Inténtalo de nuevo.',
    }
  }

  const resolvedIds = hashtags.filter((tag) => !tag.id.startsWith('new:')).map((tag) => tag.id)

  if (resolvedIds.length > 0) {
    await supabase
      .from('metoo_profile_hashtags')
      .insert(resolvedIds.map((id) => ({ profile_id: user.id, hashtag_id: id })))
  }

  // Derive a category for the matching system from the selected hashtags
  const matchingTag = hashtags.find((h) => CATEGORY_SLUGS.includes(h.slug))
  if (matchingTag) {
    const { data: cat } = await supabase
      .from('metoo_categories')
      .select('id')
      .eq('slug', matchingTag.slug)
      .single()
    if (cat) {
      await supabase
        .from('metoo_profile_categories')
        .insert({ profile_id: user.id, category_id: cat.id })
    }
  }

  return { success: true }
}
