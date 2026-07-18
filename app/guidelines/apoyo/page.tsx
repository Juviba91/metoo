import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Guía para quien busca apoyo — metoo' }

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

export default function ApoyoPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/guidelines" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <a href="/" className="text-lg font-bold tracking-tight">metoo.</a>
          <Link href="/guidelines/ayudante" className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
            Ver guía del otro rol <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 pb-20">

        {/* Hero */}
        <div className="mb-14">
          <div className="mb-4 text-5xl">🤝</div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Guía para quien busca apoyo
          </p>
          <h1 className="mb-5 text-4xl font-bold leading-tight">
            No tienes que pasar por esto solo
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Pedir apoyo cuando lo necesitas no es debilidad — es lo más inteligente y
            valiente que puedes hacer. Esta guía te explica cómo funciona metoo, qué
            puedes esperar y cómo cuidarte mientras lo usas.
          </p>
        </div>

        {/* Índice */}
        <div className="mb-14 rounded-2xl border border-border bg-muted/20 p-6">
          <p className="mb-3 text-sm font-semibold text-foreground">Contenido</p>
          <ol className="space-y-1.5 text-sm text-muted-foreground">
            {[
              'Qué es el apoyo entre iguales',
              'Qué puedes encontrar aquí',
              'Tu privacidad y seguridad',
              'Cómo empezar una conversación',
              'Qué esperar del voluntario',
              'Qué NO esperar del voluntario',
              'Tus derechos en metoo',
              'Cuándo buscar ayuda profesional',
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

        <Section num="01" title="Qué es el apoyo entre iguales">
          <p>
            El apoyo entre iguales es una forma de ayuda en la que alguien que ha
            vivido una experiencia difícil acompaña a otra persona que está pasando
            por algo similar ahora mismo.
          </p>
          <p>
            No es terapia. No es asesoramiento médico. Es algo diferente — y a veces,
            más poderoso que cualquiera de las dos cosas:
          </p>
          <Highlight>
            <p>
              Es la sensación de hablar con alguien que entiende de verdad lo que
              estás viviendo porque lo ha vivido. Alguien que puede decirte:{' '}
              <em>"Yo también estuve ahí. Y aquí estoy."</em>
            </p>
          </Highlight>
          <p>
            Los voluntarios de metoo son personas reales que han atravesado experiencias
            parecidas a la tuya — en unidades neonatales, con diagnósticos inesperados,
            con pérdidas, con miedo. No tienen respuestas perfectas, pero tienen algo
            más valioso: la comprensión que solo da haberlo vivido.
          </p>
        </Section>

        <Section num="02" title="Qué puedes encontrar aquí">
          <Item title="Escucha sin juicio">
            Personas que te escuchan sin intentar darte lecciones, sin minimizar lo
            que sientes y sin juzgar cómo lo estás llevando. No hay forma correcta o
            incorrecta de atravesar una experiencia difícil.
          </Item>
          <Item title="Alguien que lo ha vivido">
            No estás hablando con un bot ni con alguien que leyó un libro sobre el
            tema. Estás hablando con alguien que ha estado en un lugar parecido al
            tuyo y que sabe lo que significa estar ahí.
          </Item>
          <Item title="Un espacio seguro y anónimo">
            Tu identidad está protegida. Solo compartes lo que tú decides compartir,
            bajo un alias que nadie puede relacionar con tu nombre real.
          </Item>
          <Item title="Tiempo y ritmo propio">
            No hay urgencia ni plazos. Las conversaciones avanzan a tu ritmo.
            Puedes escribir cuando lo necesites y leer las respuestas cuando estés listo/a.
          </Item>
        </Section>

        <Section num="03" title="Tu privacidad y seguridad">
          <p>
            Tu seguridad dentro de metoo es nuestra prioridad. Aquí tienes lo que
            debes saber para protegerte.
          </p>
          <Item title="Usa siempre tu alias">
            Tu nombre de usuario en metoo es un alias anónimo. Nunca lo conectes con
            tu nombre real en las conversaciones.
          </Item>
          <Item title="No compartas datos personales en el chat">
            Esto incluye: nombre completo, número de teléfono, dirección, redes
            sociales, lugar de trabajo o cualquier dato que permita identificarte
            fuera de la plataforma.
          </Item>
          <Item title="Las conversaciones son privadas">
            Solo tú y el voluntario tenéis acceso a vuestras conversaciones.
            metoo no las lee.
          </Item>
          <Item title="Si algo no se siente bien, para">
            Puedes cerrar una conversación en cualquier momento y sin dar explicaciones.
            Si alguien te hace sentir incómodo/a, presionado/a o inseguro/a, cierra
            el chat. Siempre.
          </Item>
          <Highlight>
            <p>
              Ningún voluntario debería pedirte datos personales, pedirte que pagues
              por nada ni proponerte contactar fuera de metoo. Si esto ocurre,
              cierra la conversación.
            </p>
          </Highlight>
        </Section>

        <Section num="04" title="Cómo empezar una conversación">
          <p>
            No hay una forma perfecta de empezar. Pero aquí tienes algunas ideas si
            no sabes por dónde.
          </p>
          <Item title="No tienes que explicar todo de golpe">
            Puedes empezar por lo más simple: "Estoy pasando por una situación
            difícil y me gustaría hablar con alguien que lo haya vivido."
            No hace falta que justifiques por qué necesitas apoyo.
          </Item>
          <Item title="Cuenta lo que te sientas cómodo/a contando">
            No estás obligado/a a compartir nada que no quieras. Puedes ir
            compartiéndolo poco a poco, según cómo vayas sintiendo la conversación.
          </Item>
          <Item title="Si no sabes qué decir, dilo">
            "No sé cómo empezar" es un inicio tan válido como cualquier otro.
            Los voluntarios están acostumbrados a acompañar desde cualquier punto.
          </Item>
          <Item title="Si una conversación no te encaja, puedes cerrarla y buscar otra">
            No todas las personas conectan de la misma manera. Eso es normal y
            no significa que la plataforma no funcione para ti — quizás el siguiente
            voluntario sea la persona adecuada.
          </Item>
        </Section>

        <Section num="05" title="Qué esperar del voluntario">
          <Item title="Escucha y presencia">
            Lo primero que ofrece un voluntario es su atención y su tiempo. No
            soluciones, no diagnósticos — presencia.
          </Item>
          <Item title="Honestidad sobre su experiencia">
            Te contará lo que vivió él o ella, cómo lo afrontó, qué le ayudó.
            No como receta, sino como testimonio.
          </Item>
          <Item title="Respeto absoluto">
            Sin juicios sobre cómo llevas las cosas, sin presiones, sin minimizar
            lo que sientes.
          </Item>
          <Item title="Sus propios tiempos">
            Los voluntarios no están disponibles 24h. Pueden tardar en responder.
            Eso no significa que no les importe — significa que también tienen su vida.
          </Item>
        </Section>

        <Section num="06" title="Qué NO esperar del voluntario">
          <p>
            Ser honesto sobre los límites del apoyo entre iguales es parte de
            lo que hace que funcione. Un voluntario no puede ni debe ofrecerte:
          </p>
          <div className="space-y-2">
            {[
              'Diagnósticos médicos ni psicológicos',
              'Consejos sobre medicación o tratamientos',
              'Disponibilidad inmediata o a cualquier hora',
              'Responsabilizarse de tu bienestar o de tus decisiones',
              'Sustituir a un profesional de salud mental',
              'Gestionar una crisis en solitario',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-border px-4 py-2.5 text-sm">
                <span className="mt-0.5 shrink-0 text-destructive">✕</span>
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-2">
            Esto no es una limitación — es honestidad. Y esa honestidad es la que hace
            que las conversaciones en metoo sean de verdad y no una promesa vacía.
          </p>
        </Section>

        <Section num="07" title="Tus derechos en metoo">
          <Item title="Derecho a cerrar cualquier conversación">
            En cualquier momento, sin explicaciones. Tu bienestar no necesita justificación.
          </Item>
          <Item title="Derecho a no compartir nada que no quieras">
            Nadie puede presionarte para que cuentes más de lo que estás dispuesto/a.
          </Item>
          <Item title="Derecho a elegir con quién hablas">
            Si una conversación no te encaja, puedes buscar otro voluntario.
          </Item>
          <Item title="Derecho a tomarte el tiempo que necesites">
            No hay urgencia ni plazos en metoo. Avanza a tu ritmo.
          </Item>
          <Item title="Derecho a buscar ayuda profesional además de este apoyo">
            metoo no es excluyente. Puedes usar esta plataforma y al mismo tiempo
            llevar terapia, seguimiento médico o cualquier otro tipo de ayuda.
          </Item>
        </Section>

        <Section num="08" title="Cuándo buscar ayuda profesional">
          <p>
            metoo puede ser un recurso muy valioso, pero hay situaciones en las que
            necesitas algo más que el apoyo entre iguales.
          </p>
          <Highlight>
            <p className="font-medium mb-2">Busca ayuda profesional si:</p>
            <ul className="space-y-1.5 text-sm">
              <li>→ Tienes pensamientos de hacerte daño o de suicidio</li>
              <li>→ Sientes que no puedes funcionar en tu día a día</li>
              <li>→ Tu sufrimiento no disminuye con el tiempo</li>
              <li>→ Necesitas diagnóstico, medicación o tratamiento</li>
              <li>→ Lo que vives afecta seriamente a tu entorno o tus relaciones</li>
            </ul>
          </Highlight>
          <Item title="Línea 024 — atención a la conducta suicida">
            Gratuita, confidencial y disponible las 24 horas. Si tienes pensamientos
            de hacerte daño, llama ahora. No tienes que estar en peligro inmediato
            para llamar — el 024 también atiende crisis emocionales.
          </Item>
          <Item title="112 — emergencias">
            Si el peligro es inmediato para ti o para alguien de tu entorno, llama al 112.
          </Item>
          <Item title="Tu médico de cabecera">
            Es el primer punto de acceso al sistema de salud mental. Puede derivarte
            a un profesional especializado.
          </Item>
          <p>
            Buscar ayuda profesional no significa abandonar metoo. Puedes usar ambas
            cosas a la vez. Son complementarias, no excluyentes.
          </p>
        </Section>

        <Section num="09" title="Preguntas frecuentes">
          <Item title="¿Los voluntarios son psicólogos?">
            No. Son personas que han vivido una experiencia similar a la tuya y quieren
            acompañar desde esa experiencia. No tienen formación clínica en virtud de
            su rol en metoo.
          </Item>
          <Item title="¿Mis conversaciones son confidenciales?">
            Sí. Solo tú y el voluntario tenéis acceso. metoo no lee las conversaciones.
          </Item>
          <Item title="¿Y si el voluntario no me responde?">
            Los voluntarios son personas con sus propias vidas. Si pasa un tiempo sin
            respuesta, no lo interpretes como rechazo — puede que no estén disponibles
            en ese momento. Puedes buscar otro voluntario si lo necesitas.
          </Item>
          <Item title="¿Puedo hablar con más de un voluntario?">
            Sí. No estás comprometido/a a ninguna conversación en exclusiva.
          </Item>
          <Item title="¿Qué pasa si estoy en crisis mientras uso metoo?">
            metoo no es el recurso adecuado para una crisis aguda. Si estás en peligro
            inmediato o tienes pensamientos de hacerte daño, llama al 024 o al 112.
            Después, cuando estés en un lugar más estable, metoo puede seguir
            acompañándote.
          </Item>
          <Item title="¿Mis datos están seguros?">
            Tu cuenta usa un alias anónimo. No guardamos tu nombre real asociado a
            tu perfil público. Tus conversaciones son privadas.
          </Item>
        </Section>

        {/* Footer */}
        <div className="rounded-2xl border border-border bg-muted/20 p-7">
          <p className="mb-2 text-lg font-bold">Estamos aquí</p>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Dar el paso de pedir apoyo ya es mucho. Lo que encuentres aquí no va a
            resolver todo, pero puede hacer que algunos días sean más llevaderos.
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
