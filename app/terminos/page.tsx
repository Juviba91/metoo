import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Términos' }

/**
 * Datos del titular del servicio.
 *
 * La LSSI (Ley 34/2002, art. 10) obliga a identificar a quien presta el
 * servicio por medios que permitan un acceso directo y gratuito. Es el mismo
 * dato que la política de privacidad; si algún día actúas como autónomo o
 * entidad, aquí harían falta también el NIF y el domicilio.
 */
const TITULAR = {
  nombre: 'Juan de Villanueva Baygual',
  email: 'juan@bay-apps.com',
}

const ACTUALIZADA = 'septiembre de 2026'

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
        <p className="mb-10 text-sm text-muted-foreground">
          Última actualización: {ACTUALIZADA}
        </p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          {/* Lo primero de todo, y sin tener que buscarlo. */}
          <section className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-5">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Si estás en una situación de riesgo, esto no es el sitio
            </h2>
            <p className="text-foreground">
              metoo no atiende urgencias y nadie está vigilando los mensajes. Si tú o alguien
              corréis peligro, o si estás pensando en quitarte la vida:
            </p>
            <ul className="mt-3 ml-4 list-disc space-y-1.5">
              <li>
                <strong className="text-foreground">024</strong> — Línea de atención a la conducta
                suicida. Gratuita, confidencial, 24 horas.
              </li>
              <li>
                <strong className="text-foreground">112</strong> — Emergencias.
              </li>
              <li>
                <strong className="text-foreground">717 003 717</strong> — Teléfono de la
                Esperanza.
              </li>
            </ul>
            <p className="mt-3 text-sm">
              Escribir aquí no avisa a nadie. Puede que la persona al otro lado esté durmiendo,
              o que no vuelva a entrar en semanas.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">1. Quién presta el servicio</h2>
            <p>
              metoo lo mantiene {TITULAR.nombre} como proyecto sin ánimo de lucro. Es gratuito, no
              tiene publicidad y no se vende nada. Para cualquier cosa relacionada con el servicio:{' '}
              <a
                href={`mailto:${TITULAR.email}`}
                className="text-foreground underline underline-offset-2"
              >
                {TITULAR.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. Qué es metoo</h2>
            <p>
              Una plataforma de apoyo entre pares. Pone en contacto a personas que atraviesan una
              situación difícil con voluntarios que han vivido algo parecido, para que hablen entre
              ellos. Eso es todo lo que hace metoo: poner en contacto.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">3. Qué NO es metoo</h2>
            <p className="mb-3">
              Esto importa más que lo anterior, así que va con detalle:
            </p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong className="text-foreground">No es un servicio sanitario</strong>, ni de
                salud mental, ni de asistencia social. No sustituye a tu médico, tu psicólogo, tu
                matrona ni tu trabajadora social. Nada de lo que leas aquí es consejo médico,
                psicológico, jurídico ni de ningún otro tipo profesional.
              </li>
              <li>
                <strong className="text-foreground">Los voluntarios no son profesionales.</strong>{' '}
                Son personas que pasaron por algo parecido y quieren acompañar. Cuentan su
                experiencia, no dan diagnósticos ni tratamientos. Si alguien te dice lo que tienes
                que hacer con tu salud, desconfía y repórtalo.
              </li>
              <li>
                <strong className="text-foreground">No verificamos a nadie.</strong> No
                comprobamos la identidad de quien se registra, ni su edad, ni que haya vivido de
                verdad lo que dice haber vivido, ni su formación. No hay entrevistas ni
                acreditaciones. Puedes bloquear y reportar a cualquiera en cualquier momento.
              </li>
              <li>
                <strong className="text-foreground">No hay nadie de guardia.</strong> No vigilamos
                las conversaciones en tiempo real, no hay turnos, no hay tiempos de respuesta y no
                garantizamos que alguien vaya a contestarte, ni hoy ni nunca. Un mensaje enviado
                aquí no es una petición de ayuda que alguien vaya a recibir.
              </li>
              <li>
                <strong className="text-foreground">No es un canal de emergencia.</strong> Ver el
                aviso del principio.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Quién puede usar metoo</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>Debes tener al menos 16 años.</li>
              <li>Debes dar un correo válido y usarlo tú.</li>
              <li>
                Solo puedes tener una cuenta. Las cuentas múltiples o falsas se pueden eliminar.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">5. Normas de conducta</h2>
            <p className="mb-3">Al usar metoo te comprometes a:</p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Tratar a todo el mundo con respeto.</li>
              <li>No mentir sobre tu situación ni sobre lo que has vivido.</li>
              <li>No dar consejo médico ni recomendar tratamientos, medicación o terapias.</li>
              <li>No acosar, insultar ni amenazar.</li>
              <li>No usar la plataforma para vender, captar clientes, reclutar ni hacer estudios.</li>
              <li>No pedir dinero ni datos bancarios a otro usuario.</li>
              <li>No publicar contenido ilegal o dañino.</li>
              <li>
                No sacar de aquí lo que otra persona te cuente. Lo que se comparte en metoo es
                suyo, no tuyo.
              </li>
            </ul>
            <p className="mt-3">
              Las <Link href="/guidelines" className="text-foreground underline underline-offset-2">
                normas de la comunidad
              </Link>{' '}
              desarrollan esto y forman parte de estos términos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              6. Contenido de los usuarios
            </h2>
            <p>
              Lo que se escribe en metoo lo escriben sus usuarios. No lo revisamos antes de que se
              publique ni respondemos de su veracidad, de su exactitud ni de las decisiones que
              alguien tome a partir de él.
            </p>
            <p className="mt-3">
              Actuamos como prestador de servicios de alojamiento en el sentido de la Ley 34/2002
              (LSSI): en cuanto tenemos conocimiento efectivo de un contenido ilícito o que
              incumple estas normas, lo retiramos o bloqueamos la cuenta con diligencia. Para
              avisarnos tienes el botón de reportar en cada conversación y en cada publicación, o{' '}
              <a
                href={`mailto:${TITULAR.email}`}
                className="text-foreground underline underline-offset-2"
              >
                {TITULAR.email}
              </a>
              .
            </p>
            <p className="mt-3">
              Conservas todos los derechos sobre lo que escribes. Solo nos autorizas a alojarlo y
              mostrarlo dentro de metoo para que el servicio funcione.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              7. Responsabilidad
            </h2>
            <p>
              metoo se ofrece tal cual, gratis y sin ánimo de lucro, y puede fallar, estar caído o
              dejar de existir. No garantizamos disponibilidad, ni que encuentres a alguien, ni que
              la conversación te siente bien.
            </p>
            <p className="mt-3">
              En la medida en que lo permita la ley, {TITULAR.nombre} no responde de lo que ocurra
              entre usuarios: ni del contenido de los mensajes, ni del comportamiento de las
              personas que conozcas aquí, ni de las decisiones que tomes tras hablar con ellas, ni
              de los daños derivados de haber usado metoo en lugar de acudir a un profesional.
            </p>
            <p className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              Esta limitación tiene los límites que impone la ley y no pretende ir más allá: no se
              excluye la responsabilidad por dolo ni por negligencia grave, ni por daños a la vida
              o a la integridad física, ni los derechos que te correspondan como consumidor, que
              siguen intactos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">8. Cuentas y suspensión</h2>
            <p>
              Podemos suspender o eliminar una cuenta que incumpla estas normas. Si es algo grave
              —acoso, amenazas, poner a alguien en peligro— puede ser de inmediato y sin aviso.
            </p>
            <p className="mt-3">
              Puedes darte de baja tú, en cualquier momento y sin dar explicaciones, desde{' '}
              <strong className="text-foreground">Mi perfil → Eliminar cuenta</strong>. Es
              inmediato y no se puede deshacer. Se va todo menos las conversaciones que tuviste,
              que le quedan a la otra persona; te lo contamos antes de borrar y con detalle en la{' '}
              <Link href="/privacidad" className="text-foreground underline underline-offset-2">
                política de privacidad
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">9. Cambios</h2>
            <p>
              Podemos actualizar estos términos. Si el cambio es importante te avisamos por correo.
              Seguir usando metoo después implica aceptarlos; si no te convencen, puedes darte de
              baja.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">10. Ley aplicable</h2>
            <p>
              Se aplica la ley española. Si eres consumidor, puedes reclamar ante los juzgados de
              tu domicilio, y nada de lo anterior te quita esa opción.
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
