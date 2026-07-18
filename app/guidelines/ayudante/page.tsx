import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Guía para voluntarios — metoo' }

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        {num}
      </p>
      <h2 className="mb-5 text-2xl font-bold">{title}</h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
      <p className="mb-1 font-semibold text-foreground">{title}</p>
      <p>{children}</p>
    </div>
  )
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-5 py-4 text-foreground">
      {children}
    </div>
  )
}

export default function AyudantePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/guidelines" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <a href="/" className="text-lg font-bold tracking-tight">metoo.</a>
          <Link href="/guidelines/apoyo" className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
            Ver guía del otro rol <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 pb-20">

        {/* Hero */}
        <div className="mb-14">
          <div className="mb-4 text-5xl">💛</div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Guía para voluntarios
          </p>
          <h1 className="mb-5 text-4xl font-bold leading-tight">
            Acompañar bien es un arte
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Has vivido algo difícil y quieres que esa experiencia sirva a otros. Eso es
            enorme. Esta guía te ayuda a hacerlo de forma segura, honesta y sostenible
            — para quien recibes y para ti.
          </p>
        </div>

        {/* Índice */}
        <div className="mb-14 rounded-2xl border border-border bg-muted/20 p-6">
          <p className="mb-3 text-sm font-semibold text-foreground">Contenido</p>
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            {[
              'Por qué importa lo que haces',
              'Tu rol: qué eres y qué no eres',
              'Cómo escuchar de verdad',
              'Hablar desde la experiencia, no desde el consejo',
              'Situaciones difíciles',
              'Tus límites y tu autocuidado',
              'Privacidad y anonimato',
              'Normas de uso de la plataforma',
              'Preguntas frecuentes',
            ].map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-5 shrink-0 font-medium text-foreground/40">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {t}
              </li>
            ))}
          </ol>
        </div>

        <Section num="01" title="Por qué importa lo que haces">
          <p>
            Cuando alguien está en medio de una experiencia dolorosa — una UCI neonatal,
            una pérdida, un diagnóstico inesperado — lo que más necesita no siempre es
            un profesional. A veces necesita a alguien que diga:{' '}
            <em>"Yo también lo viví. Y sobreviví."</em>
          </p>
          <p>
            Ese mensaje no lo puede dar un libro ni un algoritmo. Solo tú puedes darlo.
            Y tiene un poder que la mayoría de los tratamientos no tienen: la validación
            de alguien que ha estado en el mismo lugar.
          </p>
          <Highlight>
            <p className="font-medium">Tu experiencia no es una debilidad. Es tu mayor herramienta.</p>
          </Highlight>
          <p>
            Dicho esto, acompañar a otros desde el dolor propio también tiene riesgos.
            Esta guía existe para que puedas hacerlo bien: de forma útil para quien te
            busca, y sin poner en riesgo tu propio equilibrio.
          </p>
        </Section>

        <Section num="02" title="Tu rol: qué eres y qué no eres">
          <p>
            Antes de empezar, es importante que tengas claro qué puedes ofrecer y qué
            no. No por limitarte, sino para que lo que des sea de verdad valioso.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="mb-2 font-semibold text-foreground">✓ Eres</p>
              <ul className="space-y-1.5 text-sm">
                <li>Una persona que ha vivido algo similar</li>
                <li>Un espacio de escucha sin juicio</li>
                <li>Alguien que puede normalizar lo que siente</li>
                <li>Una voz que dice "no estás solo/a"</li>
                <li>Un puente hacia la ayuda profesional</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="mb-2 font-semibold text-foreground">✗ No eres</p>
              <ul className="space-y-1.5 text-sm">
                <li>Un terapeuta ni un psicólogo</li>
                <li>Un médico ni un especialista</li>
                <li>El responsable de su recuperación</li>
                <li>Alguien que debe estar siempre disponible</li>
                <li>La última línea de defensa ante una crisis</li>
              </ul>
            </div>
          </div>
          <p>
            Esta distinción no es para infravalorarte. Es para protegerte a ti y a quien
            te busca. Cuando ambos sabéis qué es esto, la conversación es más honesta y
            más útil.
          </p>
        </Section>

        <Section num="03" title="Cómo escuchar de verdad">
          <p>
            La escucha activa es la habilidad más importante que puedes practicar en
            metoo. No significa ser pasivo — significa estar presente de verdad.
          </p>
          <Item title="Deja espacio para el silencio">
            No sientas la necesidad de llenar cada pausa con palabras. A veces la persona
            necesita tiempo para ordenar sus pensamientos. Un "tómate el tiempo que
            necesites" vale más que una respuesta rápida.
          </Item>
          <Item title="Refleja, no interpretes">
            En lugar de decir lo que crees que siente, repite con tus palabras lo que has
            entendido: "Si te entiendo bien, estás agotado/a no solo físicamente sino
            también de tener que ser fuerte todo el tiempo, ¿es así?". Esto valida y abre
            la conversación.
          </Item>
          <Item title="Pregunta, no asumas">
            Cada persona vive las cosas de forma distinta. Aunque tu experiencia sea muy
            parecida, no des por hecho que siente exactamente lo mismo que tú. Pregunta:
            "¿Cómo está siendo esto para ti?"
          </Item>
          <Item title="Valida primero, aconseja nunca">
            Antes de cualquier cosa, reconoce lo que está viviendo. "Tiene todo el sentido
            que te sientas así" es más poderoso de lo que parece. Y generalmente, no
            necesitan consejo — necesitan sentirse escuchados.
          </Item>
          <Highlight>
            <p>
              <strong>Recuerda:</strong> no tienes que solucionar nada. Tu trabajo es
              acompañar, no arreglar. Eso es exactamente lo que hace que esto funcione.
            </p>
          </Highlight>
        </Section>

        <Section num="04" title="Hablar desde la experiencia, no desde el consejo">
          <p>
            Esta es la clave de lo que hace diferente a metoo de cualquier otro recurso.
            No estás aquí para dar consejos genéricos — estás aquí para compartir lo que
            viviste tú.
          </p>
          <Item title="Usa el &quot;yo&quot; en lugar del &quot;tú deberías&quot;">
            En vez de "deberías hablar con el equipo médico", prueba: "En mi caso, cuando
            me atreví a preguntar directamente al neonatólogo, me sentí mucho más en
            control. A mí me ayudó mucho." La diferencia es enorme — una frase abre,
            la otra presiona.
          </Item>
          <Item title="No universalices tu experiencia">
            Lo que te ayudó a ti puede no ayudar a otra persona. Comparte con humildad:
            "No sé si esto te sirve, pero a mí..." Es más honesto y más respetable.
          </Item>
          <Item title="Está bien no tener respuestas">
            A veces la situación de la persona es distinta a la tuya, o simplemente no
            sabes qué decir. "No tengo respuesta para esto, pero estoy aquí" es siempre
            válido.
          </Item>
          <Item title="No minimices para animar">
            Frases como "todo pasa", "al menos..." o "podría ser peor" suelen hacer más
            daño que bien. Aunque vengan del mejor lugar, pueden hacer sentir a la
            persona que su dolor no es válido.
          </Item>
        </Section>

        <Section num="05" title="Situaciones difíciles">
          <p>
            Habrá momentos en los que la conversación vaya a lugares que no esperabas.
            Es normal. Aquí tienes orientación para los más habituales.
          </p>
          <Item title="Si alguien expresa ideas de hacerse daño">
            No te alarmes en exceso ni lo ignores. Con calma: "Lo que me cuentas me
            importa mucho. ¿Has pensado en llamar al 024? Es gratuito y disponible
            siempre." Tu papel es animarles a buscar ayuda especializada, no
            gestionar la crisis tú solo/a. Si crees que el peligro es inmediato,
            diles que llamen al 112.
          </Item>
          <Item title="Si la conversación te remueve emocionalmente">
            Es completamente normal que algunas historias te conecten con tu propio dolor
            pasado. Si sientes que te está afectando demasiado, puedes decir honestamente:
            "Necesito un momento. Te escribo pronto." Y tomarte ese momento. Tu bienestar
            no es negociable.
          </Item>
          <Item title="Si la persona pide más de lo que puedes dar">
            Si alguien empieza a depender de ti de una forma que se siente excesiva, o
            pide cosas que van más allá del apoyo emocional entre iguales, es válido
            poner límites: "Quiero seguir acompañándote, pero creo que para esto
            necesitas hablar con alguien especializado. Yo puedo estar aquí, pero no
            puedo sustituir esa ayuda."
          </Item>
          <Item title="Si alguien actúa de forma inapropiada contigo">
            Cierra la conversación. No tienes que justificarlo ni aguantarlo. Estamos
            trabajando en un sistema de reportes para estos casos.
          </Item>
        </Section>

        <Section num="06" title="Tus límites y tu autocuidado">
          <p>
            Acompañar a otros cuando tú mismo/a has pasado por algo difícil puede ser
            profundamente significativo — y también agotador si no te cuidas.
          </p>
          <Highlight>
            <p className="font-medium">
              No puedes dar lo que no tienes. Tu bienestar es parte de lo que hace
              sostenible esta comunidad.
            </p>
          </Highlight>
          <Item title="Pon límites de disponibilidad">
            No tienes obligación de responder inmediatamente ni a cualquier hora. Marca
            tus propios tiempos y sé honesto/a: "Hoy no puedo responder con calidad,
            te escribo mañana."
          </Item>
          <Item title="Rechaza conversaciones que no puedes gestionar">
            Si ves que una solicitud toca algo con lo que todavía no estás en paz, tienes
            todo el derecho a no aceptarla. No es abandono — es honestidad.
          </Item>
          <Item title="Tómate descansos">
            Si en algún momento sientes que acompañar a otros te está costando
            demasiado, para. Puedes reactivar tu perfil cuando te sientas listo/a.
          </Item>
          <Item title="Busca tu propio apoyo si lo necesitas">
            Ser voluntario no significa tenerlo todo superado. Si mientras acompañas
            a otros notas que tu propio proceso necesita atención, búscala. Un
            profesional de salud mental puede ayudarte de formas que este espacio no puede.
          </Item>
        </Section>

        <Section num="07" title="Privacidad y anonimato">
          <Item title="Protege tu identidad">
            Usa siempre tu alias. No compartas tu nombre real, número de teléfono,
            redes sociales ni ningún dato que permita identificarte fuera de metoo.
          </Item>
          <Item title="Protege la identidad de quien te escribe">
            Lo que alguien te cuente en una conversación es confidencial. No lo
            compartas con nadie fuera de la plataforma, ni siquiera de forma anónima.
          </Item>
          <Item title="Las conversaciones son privadas">
            metoo no lee tus conversaciones. Están diseñadas para ser un espacio
            privado entre dos personas.
          </Item>
        </Section>

        <Section num="08" title="Normas de uso de la plataforma">
          <Item title="Trato respetuoso siempre">
            Nada de insultos, presión, juicios ni lenguaje que hiera. Esto se aplica
            también a los momentos difíciles de la conversación.
          </Item>
          <Item title="Sin fines comerciales">
            No ofrezcas servicios de pago, productos ni hagas publicidad dentro de
            metoo. Cualquier intento de monetizar este espacio está prohibido.
          </Item>
          <Item title="Una cuenta por persona">
            No crees múltiples perfiles.
          </Item>
          <Item title="Consecuencias">
            El incumplimiento de estas normas puede suponer la suspensión inmediata
            de la cuenta.
          </Item>
        </Section>

        <Section num="09" title="Preguntas frecuentes">
          <Item title="¿Qué pasa si no sé qué decir?">
            Es completamente normal. Puedes decirlo directamente: "No tengo palabras
            para esto, pero quiero que sepas que estoy aquí." La presencia vale más
            que las respuestas perfectas.
          </Item>
          <Item title="¿Tengo que responder siempre?">
            No. Eres voluntario/a. Puedes establecer tus propios tiempos de respuesta
            y no tienes obligación de estar siempre disponible.
          </Item>
          <Item title="¿Y si la conversación me afecta a mí?">
            Es normal que algunas historias te remuevan. Permítete sentirlo, y si
            necesitas parar, para. Si notas que acompañar a otros reabre heridas que
            todavía no has cerrado, puede ser buena señal para buscar tu propio apoyo.
          </Item>
          <Item title="¿Puedo cerrar una conversación?">
            Sí, siempre. Sin culpa y sin necesidad de justificarlo.
          </Item>
          <Item title="¿Qué pasa si la persona necesita más ayuda de la que yo puedo dar?">
            Anímala con calma a buscar apoyo profesional. Puedes decir: "Lo que me
            cuentas merece atención especializada. Yo puedo acompañarte, pero un
            profesional puede ayudarte de formas que yo no puedo." Y si hay riesgo
            inmediato, 024 o 112.
          </Item>
        </Section>

        {/* Footer */}
        <div className="rounded-2xl border border-border bg-muted/20 p-7">
          <p className="mb-2 text-lg font-bold">Gracias por estar aquí</p>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Lo que ofreces no tiene precio. Una conversación tuya puede cambiar cómo
            alguien vive una de las noches más largas de su vida.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Ir al dashboard <ArrowRight className="size-4" />
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          ¿Tienes dudas?{' '}
          <a href="mailto:hola@metoo.app" className="underline hover:text-foreground">
            hola@metoo.app
          </a>{' '}
          · metoo no sustituye a un profesional · En crisis: <strong className="text-foreground">024</strong>
        </p>
      </main>
    </div>
  )
}
