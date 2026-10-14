'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { sanitizeModes, sanitizeStage, validarTextos } from '@/lib/profile-fields'
import { cookies } from 'next/headers'
import { VERSION_TEXTOS_LEGALES } from '@/lib/legal'
import { BLOQUEO_MENOR_SEGUNDOS, COOKIE_MENOR, comprobarEdad } from '@/lib/edad'

export type HashtagInput = { id: string; slug: string; label: string }

/**
 * La edad, comprobada en el primer paso y no al final: a quien no llega no se
 * le deja rellenar cinco pantallas para decírselo después.
 *
 * Quien declara menos de 16 años se queda bloqueado un día en este navegador:
 * sin eso bastaría con darle a «atrás» y cambiar el año.
 */
async function edadValida(nacimiento: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const jar = await cookies()
  if (jar.get(COOKIE_MENOR)) {
    return { ok: false, error: 'metoo es para mayores de 16 años, así que no puedes crear una cuenta.' }
  }
  const edad = comprobarEdad(nacimiento)
  if (edad.ok) return { ok: true }
  if (edad.menor) {
    jar.set(COOKIE_MENOR, '1', { path: '/', httpOnly: true, sameSite: 'lax', maxAge: BLOQUEO_MENOR_SEGUNDOS })
  }
  return { ok: false, error: edad.error }
}

export async function comprobarEdadAlta(nacimiento: string): Promise<{ ok?: boolean; error?: string }> {
  const r = await edadValida(nacimiento)
  return r.ok ? { ok: true } : { error: r.error }
}

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
  nacimiento,
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
  /** AAAA-MM-DD. Se comprueba y se descarta: no se guarda. */
  nacimiento: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) return { error: 'No autenticado' }

  // Se comprueba aquí y no solo en el botón: el consentimiento del art. 9 tiene
  // que ser explícito, y lo que no se valida en el servidor se puede saltar.
  if (aceptaTextos !== true || consentimientoSalud !== true) {
    return { error: 'Tienes que aceptar los textos y dar tu consentimiento para continuar.' }
  }

  const edad = await edadValida(nacimiento)
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
      .insert(resolvedIds.map((id) => ({ profile_id: user.id, hashtag_id: id })))

    if (hashtagError) {
      console.error('Error saving hashtags:', hashtagError)
      return { error: 'Error al guardar hashtags. Por favor intenta de nuevo.' }
    }
  }

  return { success: true }
}
