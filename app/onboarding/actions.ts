'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { sanitizeModes, sanitizeStage } from '@/lib/profile-fields'

export type HashtagInput = { id: string; slug: string; label: string }

export async function completeOnboarding({
  role,
  hashtags,
  alias,
  city,
  bio,
  stage,
  supportModes,
}: {
  role: 'seeker' | 'volunteer'
  hashtags: HashtagInput[]
  alias: string
  city: string
  bio: string
  stage?: string | null
  supportModes?: string[]
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) return { error: 'No autenticado' }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    alias: alias.trim(),
    role,
    city: city.trim(),
    country: 'ES',
    bio: bio.trim() || null,
    stage: sanitizeStage(stage),
    support_modes: sanitizeModes(supportModes),
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
    const { error: hashtagError } = await supabase
      .from('profile_hashtags')
      .insert(resolvedIds.map((id) => ({ profile_id: user.id, hashtag_id: id })))

    if (hashtagError) {
      console.error('Error saving hashtags:', hashtagError)
      return { error: 'Error al guardar hashtags. Por favor intenta de nuevo.' }
    }
  }

  return { success: true }
}
