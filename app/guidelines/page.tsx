import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Normas de la comunidad — metoo',
}

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Link
            href="/"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="text-xl font-bold tracking-tight">metoo.</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10 pb-16">
        <h1 className="mb-2 text-3xl font-bold">Normas de la comunidad</h1>
        <p className="mb-10 text-muted-foreground">
          metoo es un espacio de apoyo entre iguales. Estas normas protegen a todas las personas que
          forman parte de él.
        </p>

        {/* Bloque 1 */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-sm font-bold">1</span>
            Qué es metoo (y qué no es)
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              metoo conecta a personas que han atravesado experiencias difíciles con quienes las
              están viviendo ahora mismo. El apoyo que se ofrece aquí es <strong className="text-foreground">emocional y entre iguales</strong>,
              no profesional.
            </p>
            <p>
              Ningún voluntario de metoo es terapeuta, médico ni psicólogo en virtud de su
              participación en esta plataforma. Si necesitas atención especializada,{' '}
              <strong className="text-foreground">consulta a un profesional de salud mental</strong>.
            </p>
            <p>
              En caso de crisis o emergencia, llama al{' '}
              <strong className="text-foreground">024</strong> (línea de atención a la conducta
              suicida, gratuita y disponible 24 h) o al <strong className="text-foreground">112</strong>.
            </p>
          </div>
        </section>

        {/* Bloque 2 */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-sm font-bold">2</span>
            Para quienes buscan apoyo
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Tu identidad está protegida.</strong> Solo
                comparte lo que te sientas cómodo compartiendo. Tu alias nunca revela tu nombre real.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">No compartas datos personales</strong> en el
                chat: nombre completo, dirección, número de teléfono o cualquier información que
                permita identificarte.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Puedes cerrar una conversación</strong> en
                cualquier momento y sin dar explicaciones. Tu bienestar es lo primero.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                Si un voluntario te hace sentir incómodo o actúa de forma inapropiada,{' '}
                <strong className="text-foreground">cierra la conversación</strong>. Estamos
                trabajando en un sistema de reportes.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                El voluntario te acompaña desde su propia experiencia. No le exijas consejos
                médicos, diagnósticos ni soluciones.
              </span>
            </li>
          </ul>
        </section>

        {/* Bloque 3 */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-sm font-bold">3</span>
            Para voluntarios
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Habla desde tu experiencia.</strong> Comparte
                lo que viviste y cómo lo afrontaste, nunca como experto ni con certezas absolutas.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">No ofrezcas diagnósticos ni consejos médicos.</strong>{' '}
                Si la persona necesita atención profesional, anímale a buscarla sin intentar
                reemplazarla.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Escucha más, aconseja menos.</strong> A veces
                lo que más ayuda es saber que alguien entiende lo que estás pasando porque lo ha
                vivido.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Tu participación es voluntaria.</strong> Puedes
                rechazar conversaciones y tomarte los descansos que necesites. Cuidarte a ti también
                es parte de esto.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                Si alguien expresa ideas de hacerse daño,{' '}
                <strong className="text-foreground">no te quedes solo con eso</strong>. Anímale con
                calma a llamar al 024. No es tu responsabilidad resolver una crisis, pero sí puedes
                acompañarle a pedir ayuda.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Respeta el anonimato.</strong> No preguntes ni
                compartas información personal de las personas con las que hablas fuera de metoo.
              </span>
            </li>
          </ul>
        </section>

        {/* Bloque 4 */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-7 items-center justify-center rounded-full bg-muted text-sm font-bold">4</span>
            Normas para todos
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Trato respetuoso siempre.</strong> Nada de
                insultos, presión, manipulación ni lenguaje que hiera. Si lo recibes, cierra la
                conversación.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Sin fines comerciales.</strong> Queda prohibido
                ofrecer servicios de pago, productos o hacer publicidad dentro de la plataforma.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                <strong className="text-foreground">Una cuenta por persona.</strong> Crear múltiples
                perfiles para evadir restricciones está prohibido.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-foreground">→</span>
              <span>
                El incumplimiento de estas normas puede suponer la suspensión de la cuenta.
              </span>
            </li>
          </ul>
        </section>

        {/* Bloque final */}
        <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Una última cosa</p>
          <p>
            metoo nació de una experiencia real. Sabemos lo que significa necesitar a alguien que
            lo haya vivido. Cuida este espacio como lo que es: un lugar donde la vulnerabilidad es
            bienvenida y el respeto no es negociable.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          ¿Tienes dudas o quieres reportar algo?{' '}
          <a href="mailto:hola@metoo.app" className="underline hover:text-foreground">
            hola@metoo.app
          </a>
        </p>
      </main>
    </div>
  )
}
