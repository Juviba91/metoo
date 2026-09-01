/** @type {import('next').NextConfig} */
const nextConfig = {
  // `unoptimized: true` venía del andamiaje inicial y hacía que el navegador
  // se descargara logo.png entero (512x512, 12 KB) para pintarlo a 28 px en la
  // cabecera. Con la optimización activada, Next lo sirve ya redimensionado y
  // en WebP/AVIF al tamaño real de cada uso.
  experimental: {
    // Las cuatro pestañas son rutas dinámicas, y `staleTimes.dynamic` vale 0
    // por defecto: el router descarta el resultado en cuanto navegas, así que
    // volver a una pestaña que acabas de ver la renderizaba entera en el
    // servidor OTRA VEZ. Ida y vuelta entre Inicio y Chats = dos renders
    // completos, cada uno con su validación de sesión y sus consultas.
    //
    // Con 30 segundos, volver sobre tus pasos es instantáneo y no toca el
    // servidor. Las mutaciones no se quedan atrás: las server actions llaman a
    // revalidatePath, que invalida esta caché para esa ruta.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
}

export default nextConfig
