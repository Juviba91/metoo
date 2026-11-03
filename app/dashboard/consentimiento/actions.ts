'use server'

import { cookies } from 'next/headers'
import { createClient, getUser } from '@/lib/supabase/server'
import {
  COOKIE_CONSENTIMIENTO,
  VERSION_TEXTOS_LEGALES,
  valorCookieConsentimiento,
} from '@/lib/legal'
import { declaraEdad } from '@/lib/edad'

/**
 * Renueva el consentimiento de una cuenta que ya existe: textos, datos de
 * salud y edad, los tres a la vez.
 *
 * Lo pide el middleware a las cuentas de antes de que hubiera casilla de salud
 * y de edad, y a todas cuando sube VERSION_TEXTOS_LEGALES.
 */
export async function renovarConsentimiento({
  mayorDeEdad,
  aceptaTextos,
  consentimientoSalud,
}: {
  mayorDeEdad: boolean
  aceptaTextos: boolean
  consentimientoSalud: boolean
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  if (aceptaTextos !== true || consentimientoSalud !== true) {
    return { error: 'Para seguir usando metoo tienes que marcar las dos casillas.' }
  }

  const edad = declaraEdad(mayorDeEdad)
  if (!edad.ok) return { error: edad.error }

  const { error } = await supabase.rpc('renovar_consentimiento', {
    p_version: VERSION_TEXTOS_LEGALES,
    p_mayor_de_edad: true,
  })

  if (error) {
    console.error('renovar_consentimiento failed:', error)
    return { error: 'No se pudo guardar. Inténtalo de nuevo.' }
  }

  // Lo mismo que pondría el middleware en la siguiente visita; así no hace
  // falta otra consulta para dejarte pasar.
  const jar = await cookies()
  jar.set(COOKIE_CONSENTIMIENTO, valorCookieConsentimiento(user.id), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 365,
  })

  return { success: true }
}
