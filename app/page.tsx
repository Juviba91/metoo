import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Heart, MapPin, Shield, Users } from 'lucide-react'

const categories = [
  { emoji: '🎒', label: 'Bullying', sub: 'Escolar o laboral' },
  { emoji: '🏥', label: 'Enfermedad crónica', sub: 'Propia o de un familiar' },
  {
    emoji: '👧',
    label: 'Hijos con necesidades especiales',
    sub: 'Enfermedades raras, discapacidad',
  },
  { emoji: '💙', label: 'Pérdida de un hijo', sub: 'El dolor más difícil' },
  { emoji: '🕊️', label: 'Duelo familiar', sub: 'Pareja, padres, hermanos' },
  { emoji: '🧠', label: 'Salud mental', sub: 'Depresión, ansiedad, crisis vitales' },
]

const steps = [
  {
    n: '01',
    title: 'Cuéntanos tu situación',
    desc: 'Elige la experiencia que estás viviendo y tu ubicación. A veces también el hospital.',
  },
  {
    n: '02',
    title: 'Te conectamos con alguien',
    desc: 'Un voluntario que ha pasado exactamente por lo mismo, cerca de ti, responde.',
  },
  {
    n: '03',
    title: 'Habla sin miedo',
    desc: 'Chat privado y seguro. Sin juicios. Solo alguien que entiende de verdad.',
  },
]

const reasons = [
  {
    icon: Shield,
    title: 'Privacidad primero',
    desc: 'Anónimo por defecto. Tu nombre real solo si tú quieres.',
  },
  {
    icon: MapPin,
    title: 'Cerca de ti',
    desc: 'Filtra por ciudad, barrio o incluso hospital.',
  },
  {
    icon: Users,
    title: 'Experiencia real',
    desc: 'Los voluntarios han vivido lo mismo. No es teoría.',
  },
]

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight">metoo.</span>
          <div className="flex gap-2">
            <Link href="/auth/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Entrar
            </Link>
            <Link href="/auth/login?tab=register" className={cn(buttonVariants({ size: 'sm' }))}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <Heart className="size-3.5" />
          <span>Apoyo entre personas que lo han vivido de verdad</span>
        </div>

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Alguien ya estuvo
          <br />
          donde estás tú.
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-muted-foreground">
          metoo conecta a personas que están pasando por momentos difíciles con voluntarios que han
          vivido la misma experiencia. Cerca de ti. Sin juicios.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/login?tab=register"
            className={cn(buttonVariants(), 'w-full gap-2 px-8 py-5 text-base sm:w-auto')}
          >
            Busco apoyo
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/auth/login?tab=register"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full gap-2 px-8 py-5 text-base sm:w-auto')}
          >
            Quiero ayudar
            <Heart className="size-4" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-14 text-center text-3xl font-bold">Cómo funciona</h2>
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n}>
                <span className="text-5xl font-bold text-border">{step.n}</span>
                <h3 className="mb-2 mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-3 text-center text-3xl font-bold">Experiencias que acompañamos</h2>
        <p className="mb-12 text-center text-muted-foreground">
          No estás solo en ninguna de estas situaciones.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.label}
              className="rounded-xl border border-border p-5 transition-colors hover:bg-muted/50"
            >
              <span className="mb-3 block text-3xl">{cat.emoji}</span>
              <h3 className="mb-1 font-semibold">{cat.label}</h3>
              <p className="text-sm text-muted-foreground">{cat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why metoo */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-14 text-center text-3xl font-bold">Por qué metoo</h2>
          <div className="grid gap-10 text-center sm:grid-cols-3">
            {reasons.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-border bg-background">
                  <Icon className="size-5" />
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="mb-4 text-4xl font-bold">¿Listo para dar el primer paso?</h2>
        <p className="mb-8 text-lg text-muted-foreground">
          Sea para pedir ayuda o para ofrecerla, empieza hoy.
        </p>
        <Link
          href="/auth/login?tab=register"
          className={cn(buttonVariants(), 'gap-2 px-10 py-5 text-base')}
        >
          Unirme a metoo
          <ArrowRight className="size-4" />
        </Link>
        <p className="mt-8 text-xs text-muted-foreground">
          metoo no sustituye a un profesional de salud mental. En una emergencia, llama al{' '}
          <strong>024</strong> (España) o al servicio de emergencias de tu país.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-semibold text-foreground">metoo.</span>
          <span>© 2025 metoo. Hecho con cuidado.</span>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacidad
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Términos
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
