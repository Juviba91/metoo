import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'Normas de la comunidad — metoo' }

export default async function GuidelinesPage() {
  // Auto-redirect logged-in users to their role's guidelines
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'volunteer') redirect('/guidelines/ayudante')
    if (profile?.role === 'seeker') redirect('/guidelines/apoyo')
  }

  // Not logged in or no profile → show role selection
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 px-6 py-5">
        <a href="/" className="text-xl font-bold tracking-tight">metoo.</a>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Comunidad metoo
        </p>
        <h1 className="mb-4 text-4xl font-bold leading-tight">
          Normas de la comunidad
        </h1>
        <p className="mb-12 max-w-md text-lg text-muted-foreground leading-relaxed">
          metoo es un espacio de apoyo entre iguales. Las normas son distintas según tu
          rol — elige para leer las tuyas.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/guidelines/ayudante"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-muted/20 p-7 transition-all hover:border-foreground/30 hover:bg-muted/40"
          >
            <div>
              <div className="mb-4 text-4xl">💛</div>
              <h2 className="mb-2 text-xl font-bold">Soy voluntario</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Quiero acompañar a otros desde mi experiencia. Aquí aprenderás cómo
                hacerlo bien, cómo protegerte y cómo gestionar situaciones difíciles.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-medium">
              Guía para voluntarios
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/guidelines/apoyo"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-muted/20 p-7 transition-all hover:border-foreground/30 hover:bg-muted/40"
          >
            <div>
              <div className="mb-4 text-4xl">🤝</div>
              <h2 className="mb-2 text-xl font-bold">Busco apoyo</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Estoy pasando por algo difícil y quiero conectar con alguien que lo
                haya vivido. Aquí encontrarás qué esperar y cómo cuidar tu privacidad.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-sm font-medium">
              Guía para quien busca apoyo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          También puedes leer las normas de la otra parte — entender ambas perspectivas
          enriquece la comunidad.
        </p>
      </main>

      <footer className="border-t border-border/60 px-6 py-5 text-center text-xs text-muted-foreground">
        metoo no sustituye a un profesional de salud mental · En crisis, llama al{' '}
        <strong className="text-foreground">024</strong> · hola@metoo.app
      </footer>
    </div>
  )
}
