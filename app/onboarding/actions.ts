'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { sanitizeModes, sanitizeStage, validarTextos } from '@/lib/profile-fields'
import { VERSION_TEXTOS_LEGALES } from '@/lib/legal'
import { declaraEdad } from '@/lib/edad'

/**
 * `role`: de qué lado está esta persona en ESE tema. Si no viene, el trigger
 * de la base pone el de la cuenta (`profile_hashtags_rol_por_defecto`).
 */
export type HashtagInput = { id: string; slug: string; label: string; role?: string }

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
  mayorDeEdad,
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
  /** La casilla «Tengo 16 años o más» (lib/edad.ts). */
  mayorDeEdad: boolean
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) return { error: 'No autenticado' }

  // Se comprueba aquí y no solo en el botón: el consentimiento del art. 9 tiene
  // que ser explícito, y lo que no se valida en el servidor se puede saltar.
  if (aceptaTextos !== true || consentimientoSalud !== true) {
    return { error: 'Tienes que aceptar los textos y dar tu consentimiento para continuar.' }
  }

  const edad = declaraEdad(mayorDeEdad)
  if (!edad.ok) return { error: edad.error }

  const textos = validarTextos({ alias, city, bio })
  if (!textos.ok) return { error: textos.error }

  const ahora = new Date().toISOString()
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    alias: textos.valores.alias,
    role,
    city: textos.valores.city,
    country: 'ES',
    bio: textos.valores.bio,
    stage: sanitizeStage(stage),
    support_modes: sanitizeModes(supportModes),
    consentimiento_en: ahora,
    consentimiento_version: VERSION_TEXTOS_LEGALES,
    consentimiento_salud_en: ahora,
    consentimiento_salud_version: VERSION_TEXTOS_LEGALES,
    edad_comprobada_en: ahora,
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
      .insert(
        resolvedIds.map((id) => {
          const rol = hashtags.find((t) => t.id === id)?.role
          return rol === 'seeker' || rol === 'volunteer'
            ? { profile_id: user.id, hashtag_id: id, role: rol }
            : { profile_id: user.id, hashtag_id: id }
        }),
      )

    if (hashtagError) {
      console.error('Error saving hashtags:', hashtagError)
      return { error: 'Error al guardar hashtags. Por favor intenta de nuevo.' }
    }
  }

  return { success: true }
}

/**
 * Apunta el paso del alta al que ha llegado esta cuenta, para saber dónde se
 * queda quien no termina (migración 20261104). Solo guarda el más lejano y
 * nada si ya hay perfil. Si falla (p. ej. sin migrar) no pasa nada: el alta
 * sigue igual.
 */
export async function marcarPasoAlta(paso: number): Promise<void> {
  if (!Number.isInteger(paso)) return
  const supabase = await createClient()
  const { error } = await supabase.rpc('marcar_paso_alta', { p_paso: paso })
  if (error) console.error('marcar_paso_alta failed:', error.message)
}
