'use client'

import { useState } from 'react'
import { SiteFooter } from '@/components/site-footer'

type Role = 'volunteer' | 'seeker'

function Item({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-5 py-4">
      <p className="mb-1 font-semibold text-foreground">{title}</p>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-5 py-4 text-[15px] leading-relaxed text-foreground">
      {children}
    </div>
  )
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">{num}</p>
      <h2 className="mb-5 text-xl font-bold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function VolunteerContent() {
  return (
    <>
      <Section num="01" title="Por qué importa lo que haces">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Cuando alguien está en medio de una experiencia dolorosa — una UCI neonatal, una pérdida,
          un diagnóstico inesperado — lo que más necesita no siempre es un profesional. A veces
          necesita a alguien que diga: <em>"Yo también lo viví. Y sobreviví."</em>
        </p>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Ese mensaje no lo puede dar un libro ni un algoritmo. Solo tú puedes darlo. Y tiene un
          poder que la mayoría de los tratamientos no tienen: la validación de alguien que ha
          estado en el mismo lugar.
        </p>
        <Highlight>
          <p className="font-medium">Tu experiencia no es una debilidad. Es tu mayor herramienta.</p>
        </Highlight>
      </Section>

      <Section num="02" title="Tu rol: qué eres y qué no eres">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <p className="mb-2 font-semibold text-foreground">✓ Eres</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>Una persona que ha vivido algo similar</li>
              <li>Un espacio de escucha sin juicio</li>
              <li>Alguien que puede normalizar lo que siente</li>
              <li>Una voz que dice "no estás solo/a"</li>
              <li>Un puente hacia la ayuda profesional</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <p className="mb-2 font-semibold text-foreground">✗ No eres</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>Un terapeuta ni un psicólogo</li>
              <li>Un médico ni un especialista</li>
              <li>El responsable de su recuperación</li>
              <li>Alguien que debe estar siempre disponible</li>
              <li>La última línea de defensa ante una crisis</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section num="03" title="Cómo escuchar de verdad">
        <Item title="Deja espacio para el silencio">
          No sientas la necesidad de llenar cada pausa. A veces la persona necesita tiempo
          para ordenar sus pensamientos. Un "tómate el tiempo que necesites" vale más que
          una respuesta rápida.
        </Item>
        <Item title="Refleja, no interpretes">
          En lugar de decir lo que crees que siente, repite lo que has entendido: "Si te
          entiendo bien, estás agotado/a no solo físicamente sino también de tener que ser
          fuerte todo el tiempo, ¿es así?" Esto valida y abre la conversación.
        </Item>
        <Item title="Pregunta, no asumas">
          Cada persona vive las cosas de forma distinta. Aunque tu experiencia sea parecida,
          no des por hecho que siente exactamente lo mismo. Pregunta: "¿Cómo está siendo
          esto para ti?"
        </Item>
        <Item title="Valida primero, aconseja nunca">
          "Tiene todo el sentido que te sientas así" es más poderoso de lo que parece.
          Generalmente no necesitan consejo — necesitan sentirse escuchados.
        </Item>
        <Highlight>
          <strong>Recuerda:</strong> no tienes que solucionar nada. Tu trabajo es acompañar,
          no arreglar.
        </Highlight>
      </Section>

      <Section num="04" title="Hablar desde la experiencia, no desde el consejo">
        <Item title='Usa el "yo" en lugar del "tú deberías"'>
          En vez de "deberías hablar con el médico", prueba: "En mi caso, cuando me atreví
          a preguntar directamente al neonatólogo me sentí mucho más en control. A mí me
          ayudó mucho." La diferencia es enorme — una frase abre, la otra presiona.
        </Item>
        <Item title="No universalices tu experiencia">
          Lo que te ayudó a ti puede no ayudar a otra persona. Comparte con humildad:
          "No sé si esto te sirve, pero a mí..." Es más honesto y más respetable.
        </Item>
        <Item title="Está bien no tener respuestas">
          A veces no sabes qué decir. "No tengo respuesta para esto, pero estoy aquí"
          es siempre válido.
        </Item>
        <Item title="No minimices para animar">
          Frases como "todo pasa", "al menos..." o "podría ser peor" suelen hacer más daño
          que bien, aunque vengan del mejor lugar. Pueden hacer sentir que su dolor no es válido.
        </Item>
      </Section>

      <Section num="05" title="Situaciones difíciles">
        <Item title="Si alguien expresa ideas de hacerse daño">
          Con calma: "Lo que me cuentas me importa mucho. ¿Has pensado en llamar al 024?
          Es gratuito y disponible siempre." Tu papel es animarles a buscar ayuda
          especializada, no gestionar la crisis tú solo/a. Si el peligro es inmediato,
          diles que llamen al 112.
        </Item>
        <Item title="Si la conversación te remueve emocionalmente">
          Es normal que algunas historias te conecten con tu propio dolor. Puedes decir:
          "Necesito un momento. Te escribo pronto." Y tomarte ese momento. Tu bienestar
          no es negociable.
        </Item>
        <Item title="Si la persona pide más de lo que puedes dar">
          Es válido poner límites: "Quiero seguir acompañándote, pero para esto creo que
          necesitas hablar con alguien especializado. Yo puedo estar aquí, pero no puedo
          sustituir esa ayuda."
        </Item>
        <Item title="Si alguien actúa de forma inapropiada contigo">
          Cierra la conversación. No tienes que justificarlo ni aguantarlo.
        </Item>
      </Section>

      <Section num="06" title="Tus límites y tu autocuidado">
        <Highlight>
          <p className="font-medium">No puedes dar lo que no tienes. Tu bienestar es parte de lo que hace sostenible esta comunidad.</p>
        </Highlight>
        <Item title="Pon límites de disponibilidad">
          No tienes obligación de responder inmediatamente ni a cualquier hora. Puedes decir:
          "Hoy no puedo responder con calidad, te escribo mañana."
        </Item>
        <Item title="Rechaza conversaciones que no puedes gestionar">
          Si ves que una solicitud toca algo con lo que todavía no estás en paz, tienes todo
          el derecho a no aceptarla. No es abandono — es honestidad.
        </Item>
        <Item title="Tómate descansos">
          Si sientes que acompañar a otros te está costando demasiado, para. Puedes
          reactivar tu perfil cuando estés listo/a.
        </Item>
        <Item title="Busca tu propio apoyo si lo necesitas">
          Ser voluntario no significa tenerlo todo superado. Si mientras acompañas a otros
          notas que tu propio proceso necesita atención, búscala.
        </Item>
      </Section>

      <Section num="07" title="Del chat a la vida real">
        <Highlight>
          <p className="font-medium">metoo es el punto de partida, no el destino.</p>
          <p className="mt-1">El chat sirve para el primer contacto. Cuando haya confianza,
          lo natural es pasar a una llamada, una videollamada o un encuentro en persona.</p>
        </Highlight>
        <Item title="Comparte tu contacto cuando estéis listos">
          Cuando sientas que hay conexión real con la persona que acompañas, puedes ofrecerle
          tu número de teléfono o la forma de contacto que prefieras para seguir fuera de metoo.
          No hay obligación ni prisa — que fluya.
        </Item>
        <Item title="Tu alias te protege al principio">
          Empieza siempre con tu alias. Comparte tu nombre real u otros datos solo cuando tú
          quieras y con quien tú quieras.
        </Item>
        <Item title="Lo que te cuenten, queda entre vosotros">
          Lo que alguien comparte contigo es confidencial. No lo cuentes a terceros.
        </Item>
      </Section>

      <Section num="08" title="Normas de la plataforma">
        <Item title="Trato respetuoso siempre">
          Nada de insultos, presión, juicios ni lenguaje que hiera.
        </Item>
        <Item title="Sin fines comerciales">
          Prohibido ofrecer servicios de pago, productos o hacer publicidad dentro de metoo.
        </Item>
        <Item title="Una cuenta por persona">
          No crees múltiples perfiles.
        </Item>
        <Item title="Consecuencias">
          El incumplimiento puede suponer la suspensión inmediata de la cuenta.
        </Item>
      </Section>

      <Section num="09" title="Preguntas frecuentes">
        <Item title="¿Qué pasa si no sé qué decir?">
          Puedes decirlo directamente: "No tengo palabras para esto, pero quiero que sepas
          que estoy aquí." La presencia vale más que las respuestas perfectas.
        </Item>
        <Item title="¿Tengo que responder siempre?">
          No. Eres voluntario/a. Tus propios tiempos, sin obligación de disponibilidad constante.
        </Item>
        <Item title="¿Y si la conversación me afecta?">
          Es normal. Permítete sentirlo, y si necesitas parar, para. Si notas que acompañar
          a otros reabre heridas propias, puede ser señal de buscar tu propio apoyo.
        </Item>
        <Item title="¿Puedo cerrar una conversación?">
          Sí, siempre. Sin culpa y sin necesidad de justificarlo.
        </Item>
      </Section>
    </>
  )
}

function SeekerContent() {
  return (
    <>
      <Section num="01" title="Qué es el apoyo entre iguales">
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          El apoyo entre iguales es una forma de ayuda en la que alguien que ha vivido una
          experiencia difícil acompaña a otra persona que está pasando por algo similar ahora.
        </p>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          No es terapia. No es asesoramiento médico. Es algo diferente — y a veces, más
          poderoso que cualquiera de las dos cosas:
        </p>
        <Highlight>
          Es la sensación de hablar con alguien que entiende de verdad lo que estás viviendo
          porque lo ha vivido. Alguien que puede decirte:{' '}
          <em>"Yo también estuve ahí. Y aquí estoy."</em>
        </Highlight>
      </Section>

      <Section num="02" title="Qué puedes encontrar aquí">
        <Item title="Escucha sin juicio">
          Personas que te escuchan sin intentar darte lecciones, sin minimizar lo que sientes
          y sin juzgar cómo lo estás llevando. No hay forma correcta o incorrecta de
          atravesar algo difícil.
        </Item>
        <Item title="Alguien que lo ha vivido">
          No estás hablando con un bot. Estás hablando con alguien que ha estado en un lugar
          parecido al tuyo y sabe lo que significa estar ahí.
        </Item>
        <Item title="Un espacio seguro y anónimo">
          Tu identidad está protegida. Solo compartes lo que tú decides, bajo un alias que
          nadie puede relacionar con tu nombre real.
        </Item>
        <Item title="Tu propio ritmo">
          No hay urgencia ni plazos. Las conversaciones avanzan cuando tú lo decides.
        </Item>
      </Section>

      <Section num="03" title="Tu privacidad y seguridad">
        <Item title="Empieza con tu alias">
          Tu nombre de usuario es anónimo. No tienes que compartir tu nombre real hasta que
          tú lo decidas.
        </Item>
        <Item title="El chat es el primer paso, no el destino">
          metoo sirve para romper el hielo. Cuando sientas confianza con el voluntario,
          te recomendamos intercambiar el número de teléfono para tener conversaciones más
          fluidas — por llamada, WhatsApp o como prefiráis. Ese es el objetivo.
        </Item>
        <Item title="Comparte cuando te sientas listo/a">
          No hay prisa. Hazlo cuando sientas que hay conexión real con esa persona, no antes.
        </Item>
        <Item title="Si algo no se siente bien, para">
          Puedes cerrar una conversación en cualquier momento y sin dar explicaciones. Y puedes
          buscar otro voluntario.
        </Item>
        <Highlight>
          Ningún voluntario debería pedirte dinero ni nada de valor. Si esto ocurre, cierra
          la conversación inmediatamente.
        </Highlight>
      </Section>

      <Section num="04" title="Cómo empezar una conversación">
        <Item title="No tienes que explicar todo de golpe">
          Puedes empezar por lo más simple: "Estoy pasando por algo difícil y me gustaría
          hablar con alguien que lo haya vivido." No hace falta que justifiques por qué
          necesitas apoyo.
        </Item>
        <Item title="Cuenta lo que te sientas cómodo/a contando">
          No estás obligado/a a compartir nada que no quieras. Puedes ir compartiéndolo
          poco a poco, según cómo vayas sintiendo la conversación.
        </Item>
        <Item title="Si no sabes qué decir, dilo">
          "No sé cómo empezar" es un inicio tan válido como cualquier otro. Los voluntarios
          están acostumbrados a acompañar desde cualquier punto.
        </Item>
        <Item title="Si una conversación no te encaja, ciérrala">
          No todas las personas conectan de la misma manera. Eso es normal y puedes buscar
          otro voluntario.
        </Item>
      </Section>

      <Section num="05" title="Qué esperar del voluntario">
        <Item title="Escucha y presencia">
          Lo primero que ofrece un voluntario es su atención y su tiempo. No soluciones,
          no diagnósticos — presencia.
        </Item>
        <Item title="Honestidad sobre su experiencia">
          Te contará lo que vivió y cómo lo afrontó. No como receta, sino como testimonio.
        </Item>
        <Item title="Respeto absoluto">
          Sin juicios sobre cómo llevas las cosas, sin presiones, sin minimizar lo que sientes.
        </Item>
        <Item title="Sus propios tiempos">
          Los voluntarios no están disponibles 24h. Pueden tardar en responder — eso no
          significa que no les importe.
        </Item>
      </Section>

      <Section num="06" title="Qué NO esperar del voluntario">
        <div className="space-y-2">
          {[
            'Diagnósticos médicos ni psicológicos',
            'Consejos sobre medicación o tratamientos',
            'Disponibilidad inmediata o a cualquier hora',
            'Responsabilizarse de tu bienestar o tus decisiones',
            'Sustituir a un profesional de salud mental',
            'Gestionar una crisis en solitario',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border border-border px-4 py-2.5 text-sm">
              <span className="mt-0.5 shrink-0 text-destructive">✕</span>
              <span className="text-foreground">{item}</span>
            </div>
          ))}
        </div>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Esto no es una limitación — es honestidad. Y esa honestidad es la que hace que
          las conversaciones en metoo sean de verdad.
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
        <Item title="Derecho a usar metoo junto a otros recursos">
          Puedes llevar terapia, seguimiento médico o cualquier otro tipo de ayuda al mismo
          tiempo. metoo no es excluyente.
        </Item>
      </Section>

      <Section num="08" title="Cuándo buscar ayuda profesional">
        <Highlight>
          <p className="mb-2 font-medium">Busca ayuda profesional si:</p>
          <ul className="space-y-1.5 text-sm">
            <li>→ Tienes pensamientos de hacerte daño o de suicidio</li>
            <li>→ Sientes que no puedes funcionar en tu día a día</li>
            <li>→ Tu sufrimiento no disminuye con el tiempo</li>
            <li>→ Necesitas diagnóstico, medicación o tratamiento</li>
            <li>→ Lo que vives afecta seriamente a tu entorno o tus relaciones</li>
          </ul>
        </Highlight>
        <Item title="Línea 024 — atención a la conducta suicida">
          Gratuita, confidencial y disponible las 24 horas. No tienes que estar en peligro
          inmediato para llamar — el 024 también atiende crisis emocionales.
        </Item>
        <Item title="112 — emergencias">
          Si el peligro es inmediato para ti o para alguien de tu entorno.
        </Item>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Buscar ayuda profesional no significa abandonar metoo. Son complementarios,
          no excluyentes.
        </p>
      </Section>

      <Section num="09" title="Preguntas frecuentes">
        <Item title="¿Los voluntarios son psicólogos?">
          No. Son personas que han vivido una experiencia similar a la tuya y quieren
          acompañar desde esa experiencia.
        </Item>
        <Item title="¿Mis conversaciones son confidenciales?">
          Sí. Solo tú y el voluntario tenéis acceso. metoo no las lee.
        </Item>
        <Item title="¿Y si el voluntario no me responde?">
          Puede que no estén disponibles en ese momento. Puedes buscar otro voluntario
          si lo necesitas.
        </Item>
        <Item title="¿Qué pasa si estoy en crisis mientras uso metoo?">
          metoo no es el recurso adecuado para una crisis aguda. Si estás en peligro
          o tienes pensamientos de hacerte daño, llama al 024 o al 112. Cuando estés
          en un lugar más estable, metoo puede seguir acompañándote.
        </Item>
      </Section>
    </>
  )
}

export function GuidelinesContent({ defaultRole }: { defaultRole: 'volunteer' | 'seeker' | null }) {
  const [role, setRole] = useState<Role>(defaultRole ?? 'seeker')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-5">
        <a href="/" className="text-xl font-bold tracking-tight">metoo.</a>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12 pb-20">

        {/* Hero */}
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Comunidad metoo
        </p>
        <h1 className="mb-4 text-4xl font-bold leading-tight">Normas de la comunidad</h1>
        <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
          metoo es un espacio de apoyo entre iguales. Elige tu rol para leer las normas
          que te corresponden.
        </p>

        {/* Selector de rol */}
        <div className="mb-12 flex rounded-2xl border border-border p-1.5">
          <button
            onClick={() => setRole('volunteer')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
              role === 'volunteer'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            💛 Soy voluntario
          </button>
          <button
            onClick={() => setRole('seeker')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
              role === 'seeker'
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🤝 Busco apoyo
          </button>
        </div>

        {/* Contenido */}
        {role === 'volunteer' ? <VolunteerContent /> : <SeekerContent />}

        <div className="mt-4 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
          metoo no sustituye a un profesional de salud mental · En crisis, llama al{' '}
          <strong className="text-foreground">024</strong>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
