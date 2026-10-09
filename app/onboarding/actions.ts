'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { sanitizeModes, sanitizeStage, validarTextos } from '@/lib/profile-fields'
import { VERSION_TEXTOS_LEGALES } from '@/lib/legal'

export type HashtagInput = { id: string; slug: string; label: string }

export async function completeOnboarding({
  role,
  hashtags,
  alias,
  city,
  bio,
  stage,
  supportModes,
  aceptaTextos,
  consentimientoSalud,
}: {
  role: 'seeker' | 'volunteer'
  hashtags: HashtagInput[]
  alias: string
  city: string
  bio: string
  stage?: string | null
  supportModes?: string[]
  aceptaTextos: boolean
  consentimientoSalud: boolean
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) return { error: 'No autenticado' }

  // Se comprueba aquí y no solo en el botón: el consentimiento del art. 9 tiene
  // que ser explícito, y lo que no se valida en el servidor se puede saltar.
  if (aceptaTextos !== true || consentimientoSalud !== true) {
    return { error: 'Tienes que aceptar los textos y dar tu consentimiento para continuar.' }
  }

  const textos = validarTextos({ alias, city, bio })
  if (!textos.ok) return { error: textos.error }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    alias: textos.valores.alias,
    role,
    city: textos.valores.city,
    country: 'ES',
    bio: textos.valores.bio,
    stage: sanitizeStage(stage),
    support_modes: sanitizeModes(supportModes),
    consentimiento_en: new Date().toISOString(),
    consentimiento_version: VERSION_TEXTOS_LEGALES,
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
