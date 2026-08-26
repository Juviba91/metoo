/**
 * Convierte texto libre en un slug de hashtag.
 *
 * Vive aparte de las server actions a propósito: un módulo 'use server' solo
 * puede exportar funciones async, así que no podría exportarse desde allí.
 *
 * Devuelve cadena vacía si no queda nada utilizable; quien llama debe
 * descartar ese caso.
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
