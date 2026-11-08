import Link from 'next/link'
import { TemasConVoluntarios } from '@/components/temas-con-voluntarios'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, BookOpen, Heart } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { Logo } from '@/components/logo'
import { SiteHeaderPublic } from '@/components/site-header-public'
import type { Metadata } from 'next'

export const metadata: Metadata = { alternates: { canonical: '/' } }

const categories = [
  { emoji: '🏥', label: 'UCIN y prematuridad', sub: 'Bebés en cuidados intensivos neonatales' },
  { emoji: '💙', label: 'Pérdida y duelo', sub: 'La muerte de un ser querido' },
  { emoji: '🎗️', label: 'Enfermedad grave', sub: 'Propia, de un hijo o de un familiar' },
  { emoji: '🧠', label: 'Salud mental', sub: 'Depresión, ansiedad, crisis vitales' },
  { emoji: '🤝', label: 'Bullying y acoso', sub: 'Escolar, laboral o digital' },
  { emoji: '❤️', label: 'Cuidadores', sub: 'Acompañar a alguien que sufre agota' },
]

/**
 * Los cuatro pasos describen lo que la app hace DE VERDAD.
 *
 * Antes prometían un hospital que no se pide, un emparejamiento que no existe
 * —aquí buscas tú— y una respuesta que nadie puede garantizar. Quien llega
 * aquí suele venir recomendado por alguien: si la primera pantalla promete de
 * más, le quema a quien te mandó.
 *
 * El paso 04 sí se queda, porque es lo que la app quiere de verdad y lo que
 * ya dicen las normas de la comunidad: el chat es el principio, y cuando hay
 * confianza se pasa al teléfono. Lo que no se nombra aquí es el encuentro en
 * persona: en /guidelines está en contexto y con sus matices, y esta es la
 * página que lee cualquiera desde Google.
 */
const steps = [
  {
    n: '01',
    title: 'Eliges un alias',
    desc: 'Ni nombre real, ni foto, ni teléfono. Marcas por lo que estás pasando y, si quieres, tu ciudad.',
  },
  {
    n: '02',
    title: 'Miras quién lo ha vivido',
    desc: 'Ves a los voluntarios que han pasado por algo parecido y lees lo que cuentan de sí mismos. Eliges tú.',
  },
  {
    n: '03',
    title: 'Escribes tú, cuando quieras',
    desc: 'La conversación la abres tú. Nadie puede escribirte primero, y puedes parar cuando quieras.',
  },
  {
    n: '04',
    title: 'Del chat a la vida real',
    desc: 'Si con el tiempo hay confianza, podéis seguir por teléfono. Sin prisa, y solo si os apetece a los dos.',
  },
]

// Los recuentos de temas se regeneran cada hora; el resto es estático.
export const revalidate = 3600

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderPublic ancho="max-w-6xl" />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
        <Logo size={80} showWordmark={false} className="mb-8 drop-shadow-sm" />

        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground sm:mb-8">
          <Heart className="size-3.5" />
          <span>Apoyo de quien ya pasó por lo mismo</span>
        </div>

        <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight sm:mb-6 sm:text-5xl lg:text-6xl">
          Alguien ya estuvo
          <br />
          donde estás tú.
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:mb-10 sm:text-xl">
          metoo te deja hablar con alguien que ya pasó por lo que estás pasando tú.
          Sin dar tu nombre. Sin que nadie te juzgue.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {/* Cada botón lleva su papel: el login lo dice y el alta lo trae ya
              marcado. Antes los dos iban al mismo formulario genérico. */}
          <Link
            href="/auth/login?rol=seeker"
            className={cn(buttonVariants(), 'w-full gap-2 px-8 py-5 text-base sm:w-auto')}
          >
            Busco apoyo
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/auth/login?rol=volunteer"
            className={cn(buttonVariants({ variant: 'outline' }), 'w-full gap-2 px-8 py-5 text-base sm:w-auto')}
          >
            Quiero ayudar
            <Heart className="size-4" />
          </Link>
        </div>

        {/* Para quien llega con prisa y sin ganas de registrarse: es lo único
            de metoo que sirve en el minuto uno. */}
        <Link
          href="/guias"
          className="mt-6 inline-block text-balance text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <BookOpen className="mr-1.5 inline size-4 align-[-3px]" />
          ¿Estás pasando por algo difícil? Lee las guías, sin cuenta
        </Link>
      </section>

      <TemasConVoluntarios />

      {/* How it works */}
      <section className="bg-muted/40 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold sm:mb-14 sm:text-3xl">Cómo funciona</h2>
          {/* En el móvil, número y título en la misma línea: con el número
              grande encima, cada paso ocupaba casi media pantalla. */}
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-10 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n}>
                <div className="flex items-baseline gap-3 sm:block">
                  <span className="text-2xl font-bold text-border sm:text-5xl">{step.n}</span>
                  <h3 className="mb-1 text-lg font-semibold sm:mb-2 sm:mt-2">{step.title}</h3>
                </div>
                <p className="leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guías. Antes nada en la portada llevaba a ellas, y por
          eso tampoco las encontraba Google. */}
      <section className="mx-auto max-w-5xl px-6 pt-14 sm:pt-20">
        <div className="rounded-xl border border-border p-6 text-center sm:p-10">
          <BookOpen className="mx-auto mb-4 size-6" />
          <h2 className="mb-3 text-2xl font-bold sm:text-3xl">Lo que nadie te cuenta, escrito por quien ya lo vivió</h2>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Por dónde empezar, a quién pedir ayuda, qué papeles hacen falta, qué te sostuvo.
            Lo escriben personas que ya pasaron por lo mismo. Se lee sin cuenta.
          </p>
          <Link href="/guias" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
            Ver las guías
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">Para lo que está pensada</h2>
        <p className="mb-8 text-center text-muted-foreground sm:mb-12">
          metoo acaba de empezar y todavía somos pocos: no en todos los temas hay
          alguien esperando, y preferimos decírtelo antes de que entres.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.label}
              className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50 sm:p-5"
            >
              <span className="mb-2 block text-2xl sm:mb-3 sm:text-3xl">{cat.emoji}</span>
              <h3 className="mb-1 text-sm font-semibold sm:text-base">{cat.label}</h3>
              <p className="text-xs leading-snug text-muted-foreground sm:text-sm">{cat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Volunteer role. Con fondo gris: es el que alterna con los blancos
          desde que se quitó «Por qué metoo». */}
      <section className="bg-muted/40 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-3 text-center text-2xl font-bold sm:text-3xl">
            ¿Qué hace un voluntario?
          </h2>
          <p className="mb-10 text-center text-muted-foreground">
            Un voluntario en metoo no es psicólogo ni terapeuta. Es alguien que ha pasado por algo
            parecido y decide compartir esa experiencia de forma honesta.
          </p>
          {/* Lista y no tarjetas: tres recuadros a lo ancho alargaban la portada
              sin decir más. */}
          <ul className="mx-auto max-w-xl space-y-5">
            {[
              {
                emoji: '👂',
                titulo: 'Escucha desde la experiencia',
                texto: 'Cuenta cómo lo viviste tú: qué te ayudó, qué fue difícil, qué harías diferente. Sin teorías.',
              },
              {
                emoji: '🤝',
                titulo: 'Acompaña sin restar',
                texto: 'No le quita hierro a lo que el otro siente, aunque a ti ya no te pese.',
              },
              {
                emoji: '🚧',
                titulo: 'Conoce sus límites',
                texto: 'No da diagnósticos. Si alguien necesita ayuda profesional, se lo dice con cariño.',
              },
            ].map((v) => (
              <li key={v.titulo} className="flex gap-3">
                <span className="text-xl leading-6">{v.emoji}</span>
                <div>
                  <h3 className="font-semibold">{v.titulo}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{v.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-24">
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">¿Listo para dar el primer paso?</h2>
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
          <strong>112</strong>.
        </p>
      </section>

      <SiteFooter />
    </div>
  )
}
