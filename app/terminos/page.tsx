import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Términos' }

export default function TerminosPage() {
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
        <h1 className="mb-2 text-3xl font-bold">Términos de uso</h1>
        <p className="mb-10 text-sm text-muted-foreground">Última actualización: junio 2025</p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">1. Qué es metoo</h2>
            <p>
              metoo es una plataforma de apoyo entre pares. Conecta a personas que atraviesan
              situaciones difíciles (como tener un bebé prematuro en UCIN) con voluntarios que han
              vivido experiencias similares.
            </p>
            <p className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              ⚠️ <strong className="text-foreground">metoo no es un servicio de salud mental profesional</strong>.
              No sustituye la atención de un médico, psicólogo o trabajador social. En caso de
              emergencia, llama al <strong className="text-foreground">024</strong> o al{' '}
              <strong className="text-foreground">112</strong>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. Quién puede usar metoo</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Debes tener al menos 16 años.</li>
              <li>Debes proporcionar un email válido.</li>
              <li>
                Solo puedes tener una cuenta. Las cuentas múltiples o falsas pueden ser eliminadas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">3. Normas de conducta</h2>
            <p className="mb-3">Al usar metoo te comprometes a:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Tratar a todos los usuarios con respeto y empatía.</li>
              <li>No compartir información falsa sobre tu situación.</li>
              <li>No acosar, insultar ni amenazar a otros usuarios.</li>
              <li>No usar la plataforma con fines comerciales o de captación.</li>
              <li>No compartir contenido ilegal o dañino.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Limitación de responsabilidad</h2>
            <p>
              metoo actúa únicamente como plataforma de conexión. No somos responsables del contenido
              de los mensajes entre usuarios, de las consecuencias de las conversaciones ni de la
              disponibilidad o comportamiento de los voluntarios.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">5. Cuentas y suspensión</h2>
            <p>
              Nos reservamos el derecho de suspender o eliminar cuentas que incumplan estas normas, sin
              previo aviso. Puedes eliminar tu cuenta en cualquier momento escribiendo a{' '}
              <a href="mailto:juan@bay-apps.com" className="text-foreground underline underline-offset-2">
                juan@bay-apps.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">6. Cambios en los términos</h2>
            <p>
              Podemos actualizar estos términos en cualquier momento. Te notificaremos por email si los
              cambios son significativos. El uso continuado de metoo implica la aceptación de los nuevos
              términos.
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
