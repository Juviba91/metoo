// Service worker de metoo: solo avisos push. No guarda nada en caché a
// propósito: una app de mensajes con páginas viejas en caché enseñaría
// conversaciones desfasadas.

self.addEventListener('push', (event) => {
  let datos = {}
  try {
    datos = event.data ? event.data.json() : {}
  } catch {
    datos = { titulo: 'metoo', cuerpo: event.data ? event.data.text() : '' }
  }
  const titulo = datos.titulo || 'metoo'
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || '',
      icon: '/logo.png',
      badge: '/icon-light-32x32.png',
      // Un aviso por conversación: si llegan varios, se sustituyen en vez de apilarse.
      tag: datos.etiqueta || undefined,
      data: { url: datos.url || '/dashboard' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if ('focus' in v) {
          v.navigate(url)
          return v.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
