import Link from 'next/link'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-xl font-bold tracking-tight">
            metoo.
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold">Política de privacidad</h1>
        <p className="mb-10 text-sm text-muted-foreground">Última actualización: junio 2025</p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">1. Responsable del tratamiento</h2>
            <p>
              metoo es un servicio de apoyo entre pares. El responsable del tratamiento de tus datos es
              el equipo de metoo, contactable en{' '}
              <a href="mailto:privacidad@metoo.es" className="text-foreground underline underline-offset-2">
                privacidad@metoo.es
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. Datos que recogemos</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                <strong className="text-foreground">Email</strong>: para crear y gestionar tu cuenta. No
                lo mostramos a otros usuarios.
              </li>
              <li>
                <strong className="text-foreground">Alias</strong>: el nombre que eliges tú, anónimo por
                defecto.
              </li>
              <li>
                <strong className="text-foreground">Ciudad</strong>: para conectarte con personas
                cercanas.
              </li>
              <li>
                <strong className="text-foreground">Hospital</strong> (opcional): si decides indicarlo,
                para afinar aún más las conexiones.
              </li>
              <li>
                <strong className="text-foreground">Mensajes de chat</strong>: los intercambios privados
                entre usuarios.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">3. Para qué usamos tus datos</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Crear y mantener tu perfil en metoo.</li>
              <li>Conectarte con voluntarios o personas que buscan apoyo en situaciones similares.</li>
              <li>Permitir el chat privado entre usuarios.</li>
              <li>Mejorar el servicio de forma anónima y agregada.</li>
            </ul>
            <p className="mt-3">
              No compartimos tus datos con terceros ni los usamos para publicidad.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Cookies y sesión</h2>
            <p>
              Usamos cookies de sesión estrictamente necesarias para mantenerte conectado. No usamos
              cookies de rastreo ni analítica de terceros.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">5. Tus derechos</h2>
            <p>
              Puedes solicitar en cualquier momento la eliminación de tu cuenta y todos tus datos
              escribiendo a{' '}
              <a href="mailto:privacidad@metoo.es" className="text-foreground underline underline-offset-2">
                privacidad@metoo.es
              </a>
              . Atendemos las solicitudes en un plazo máximo de 30 días.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">6. Seguridad</h2>
            <p>
              Todos los datos se almacenan cifrados. Las conexiones utilizan HTTPS. Los chats son
              privados y solo accesibles para los dos usuarios implicados.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Volver a metoo
        </Link>
      </footer>
    </div>
  )
}
