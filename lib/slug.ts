/**
 * Convierte texto libre en un slug de hashtag.
 *
 * Vive aparte de las server actions a propósito: un módulo 'use server' solo
 * puede exportar funciones async, así que no podría exportarse desde allí.
 *
 * Devuelve cadena vacía si no queda nada utilizable; quien llama debe
 * descartar ese caso.
 */
/**
 * Normaliza la etiqueta tal y como se va a MOSTRAR.
 *
 * En el perfil se escribe texto libre y salen etiquetas con espacios
 * ("UCI Neonatal", "Duelo por un hijo"). En un post no se puede: la expresión
 * que detecta `#algo` se corta en el espacio, así que quien quiere dos palabras
 * escribe `#Gemelos_prematuros`. Los dos caminos acaban en la misma tabla y en
 * la misma pantalla, y se veía la costura.
 *
 * El guion bajo pasa a espacio porque no es ortografía de nada: quien lo
 * escribe está uniendo dos palabras. El guion normal se respeta, que en
 * castellano sí aparece de verdad ("post-parto").
 *
 * No toca el slug: `Gemelos_prematuros` y `Gemelos prematuros` ya daban los dos
 * `gemelos-prematuros`, así que eran la misma etiqueta con dos nombres.
 */
export function toLabel(text: string): string {
  return text.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()
}

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
