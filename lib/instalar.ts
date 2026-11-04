/**
 * Qué recomendación de instalar toca enseñar en este dispositivo.
 *
 * - `instalada`: ya se abre desde la pantalla de inicio. No se enseña nada.
 * - `escritorio`: en el ordenador no tiene sentido pedirlo. Tampoco.
 * - `ios`: iPhone/iPad. Safari no tiene botón de instalar: solo se puede
 *   explicar el camino (Compartir → Añadir a pantalla de inicio). Y ahí
 *   importa más que en ningún sitio, porque sin eso no hay avisos.
 * - `android`: Chrome ofrece su propio diálogo (`beforeinstallprompt`); si el
 *   navegador no lo da, se explica el menú.
 */
export type Plataforma = 'instalada' | 'escritorio' | 'ios' | 'android'

export function plataformaDeInstalacion(d: {
  ua: string
  maxTouchPoints: number
  standalone: boolean
}): Plataforma {
  if (d.standalone) return 'instalada'
  // El iPad con iPadOS 13+ se presenta como un Mac; se le distingue por la
  // pantalla táctil.
  if (/iPad|iPhone|iPod/.test(d.ua) || (/Macintosh/.test(d.ua) && d.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(d.ua)) return 'android'
  return 'escritorio'
}
