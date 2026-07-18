import Link from 'next/link'
import { Mail, Heart } from 'lucide-react'

export default function ContactoPage() {
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
        <h1 className="mb-2 text-3xl font-bold">Contacto</h1>
        <p className="mb-12 text-muted-foreground">
          Estamos aquí para escucharte. Escríbenos con cualquier duda, sugerencia o problema.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <a
            href="mailto:juan@bay-apps.com"
            className="flex items-start gap-4 rounded-xl border border-border p-6 transition-colors hover:bg-muted/40"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
              <Mail className="size-4" />
            </div>
            <div>
              <h2 className="mb-1 font-semibold">Correo general</h2>
              <p className="text-sm text-muted-foreground">juan@bay-apps.com</p>
              <p className="mt-1 text-xs text-muted-foreground">Respondemos en 24–48 h</p>
            </div>
          </a>

          <a
            href="mailto:juan@bay-apps.com?subject=Privacidad y datos — metoo"
            className="flex items-start gap-4 rounded-xl border border-border p-6 transition-colors hover:bg-muted/40"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-background">
              <Mail className="size-4" />
            </div>
            <div>
              <h2 className="mb-1 font-semibold">Privacidad y datos</h2>
              <p className="text-sm text-muted-foreground">juan@bay-apps.com</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Solicitudes de eliminación de cuenta y datos
              </p>
            </div>
          </a>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Heart className="size-4 text-muted-foreground" />
            <h2 className="font-semibold">¿Quieres ser voluntario?</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Si has pasado por una experiencia dura en la vida y quieres acompañar a otras
            familias que puedan estar pasando por lo mismo, regístrate directamente desde la app y elige el rol de voluntario en el
            onboarding.
          </p>
          <Link
            href="/auth/login?tab=register"
            className="mt-4 inline-block text-sm font-medium text-foreground underline underline-offset-2 hover:no-underline"
          >
            Crear cuenta como voluntario →
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          En caso de emergencia, llama al <strong>024</strong> (atención a la conducta suicida) o al{' '}
          <strong>112</strong>.
        </p>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Volver a metoo
        </Link>
      </footer>
    </div>
  )
}
