import QRCode from 'qrcode'

/**
 * Un QR en SVG, generado en el servidor. Sin servicios externos: el enlace de
 * una guía no tiene por qué pasar por la API de nadie para pintar un cuadrado.
 * Corrección de errores M: aguanta un cartel algo arrugado o mal impreso.
 */
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 })
}
