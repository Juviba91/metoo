export type PostListado = { id: string }

/**
 * Junta la lista que acaba de mandar el servidor con la que ya se está viendo.
 *
 * Hace falta porque el feed pagina en el cliente («Ver más») pero el servidor
 * solo manda la primera página. Cualquier server action que haga
 * `revalidatePath('/feed')` — publicar, y sobre todo dar a un corazón — hace
 * que llegue un `posts` nuevo, y el resincronizado lo metía tal cual: si
 * habías cargado tres páginas, un corazón te devolvía a la primera y perdías
 * el sitio donde estabas leyendo.
 *
 * La del servidor manda y va primero: es la verdad recién leída y viene
 * ordenada de más nueva a más vieja. Detrás, lo que ya había en pantalla y el
 * servidor no ha traído, que es lo cargado con «Ver más».
 *
 * Con la lista del servidor vacía el resultado es vacío: filtrar por una
 * etiqueta sin publicaciones no puede dejar a la vista las de la anterior.
 */
export function fusionarPosts<T extends PostListado>(delServidor: T[], enPantalla: T[]): T[] {
  if (delServidor.length === 0) return delServidor

  const yaEstan = new Set(delServidor.map((p) => p.id))
  return [...delServidor, ...enPantalla.filter((p) => !yaEstan.has(p.id))]
}
