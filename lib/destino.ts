/**
 * A dónde volver después de iniciar sesión.
 *
 * Antes el middleware mandaba al login sin recordar a dónde ibas, y el login
 * acababa siempre en Inicio: un enlace de un correo («escribe tu guía») se
 * perdía justo a quien llevaba tiempo sin entrar, que es a quien va dirigido.
 *
 * Solo se aceptan rutas internas. `//otro.com` o `/\otro.com` el navegador los
 * trata como otro dominio, y aceptarlos convertiría el login en un redirector
 * abierto para mandar a alguien a una web falsa tras escribir su contraseña.
 */
export function destinoSeguro(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/dashboard'
  }
  // Volver al login sería un bucle.
  if (next.startsWith('/auth')) return '/dashboard'
  return next
}
