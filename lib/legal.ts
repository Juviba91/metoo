/**
 * Versión de los textos legales (normas, términos y privacidad) que se
 * acepta al registrarse.
 *
 * Se guarda en `profiles.consentimiento_version` junto a la fecha, para poder
 * demostrar QUÉ texto aceptó cada persona y cuándo (RGPD art. 7.1). Se sube
 * cuando cambian de fondo, no por una errata.
 *
 * Subirla tiene consecuencias: a todas las cuentas con una versión anterior el
 * middleware las manda a /dashboard/consentimiento hasta que acepten la nueva.
 * Es a propósito —un cambio de fondo se acepta de forma expresa, no por seguir
 * usando la app—, pero es un muro para todo el mundo: solo por cambios de
 * verdad.
 */
export const VERSION_TEXTOS_LEGALES = '2026-10-14'

/** Lo que se lee al pie de las páginas legales. */
export const TEXTOS_ACTUALIZADOS = 'octubre de 2026'

/**
 * Cookie que recuerda que esta cuenta ya tiene el consentimiento al día, para
 * no consultar la base en cada navegación. Lleva el id de la cuenta: si en el
 * mismo navegador entra otra persona, no hereda el «ya aceptado».
 */
export const COOKIE_CONSENTIMIENTO = 'mt_consentimiento'

export function valorCookieConsentimiento(userId: string): string {
  return `${userId}:${VERSION_TEXTOS_LEGALES}`
}

/** Lo que hace falta tener registrado para usar la app. */
export type RegistroConsentimiento = {
  consentimiento_version: string | null
  consentimiento_salud_en: string | null
  edad_comprobada_en: string | null
}

export function consentimientoAlDia(r: RegistroConsentimiento): boolean {
  return (
    r.consentimiento_version === VERSION_TEXTOS_LEGALES &&
    r.consentimiento_salud_en !== null &&
    r.edad_comprobada_en !== null
  )
}
