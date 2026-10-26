import Link from 'next/link'
import { SiteHeaderPublic } from '@/components/site-header-public'
import { TEXTOS_ACTUALIZADOS } from '@/lib/legal'
import { TITULAR } from '@/lib/titular'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Términos' }

/*
 * Revisados en octubre de 2026 con la nota legal de Mas Calvet. La LSSI (art.
 * 10) obliga a identificar a quien presta el servicio; los datos salen de
 * lib/titular.ts, los mismos que en la política de privacidad.
 */

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderPublic showAuth={false} ancho="max-w-3xl" />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold">Términos de uso</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Última actualización: {TEXTOS_ACTUALIZADOS}
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
              <li>
                <strong className="text-foreground">016</strong> — Atención a víctimas de
                violencia de género. No deja rastro en la factura.
              </li>
              <li>
                <strong className="text-foreground">900 20 20 10</strong> — Fundación ANAR, para
                menores y para adultos preocupados por un menor.
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
              metoo es un proyecto sin ánimo de lucro de la {TITULAR.nombre}, con NIF{' '}
              {TITULAR.nif}, domicilio en {TITULAR.domicilio} e inscrita en el{' '}
              {TITULAR.registro}. Es gratuito, no tiene publicidad y no se vende nada.
            </p>
            <p className="mt-3">
              Para cualquier cosa relacionada con el servicio —también si eres una autoridad y
              necesitas contactarnos—:{' '}
              <a
                href={`mailto:${TITULAR.email}`}
                className="text-foreground underline underline-offset-2"
              >
                {TITULAR.email}
              </a>
              . Atendemos en español.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">2. Qué es metoo</h2>
            <p>
              Una plataforma de apoyo entre pares. Pone en contacto a personas que atraviesan una
              situación difícil con voluntarios que han vivido algo parecido, para que hablen entre
              ellos. Eso es todo lo que hace metoo: poner en contacto.
            </p>
            <p className="mt-3">
              No hay nadie detrás eligiendo por ti, ni seleccionamos ni recomendamos a nadie: te
              enseñamos a las personas disponibles en tus temas, según lo que cada una ha
              indicado en su perfil, y decides tú.
            </p>
            <p className="mt-3">
              Además, hay <strong className="text-foreground">guías por hospital</strong>: lo
              práctico que otras familias aprendieron allí, escrito por ellas y publicado sin
              firma (punto 6).
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
              <li>
                <strong className="text-foreground">
                  No hay garantía de que la persona al otro lado haya vivido lo que dice.
                </strong>{' '}
                Puede no ser cierto. Si algo no te cuadra, bloquea y repórtalo: no te cuesta nada
                y a nosotros nos ayuda.
              </li>
              <li>
                <strong className="text-foreground">
                  No es un servicio de acompañamiento continuado.
                </strong>{' '}
                Nadie se compromete a seguir hablando contigo, ni hoy ni mañana. Si necesitas un
                acompañamiento estable, búscalo donde sí puedan dártelo.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">4. Quién puede usar metoo</h2>
            <ul className="ml-4 list-disc space-y-1">
              <li>
                Debes tener al menos 16 años. Te pedimos la fecha de nacimiento al registrarte y,
                si no llegas, no se crea la cuenta. Si detectamos que alguien ha mentido en esto,
                eliminamos la cuenta.
              </li>
              <li>Debes dar un correo válido y usarlo tú.</li>
              <li>
                Solo puedes tener una cuenta. Las cuentas múltiples o falsas se pueden eliminar.
              </li>
              <li>
                Si eres profesional sanitario, puedes participar como cualquier otra persona,
                contando tu experiencia personal. Lo que no puedes es ejercer aquí: ni
                diagnosticar, ni recomendar tratamientos, ni captar pacientes.
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
              <li>
                No pedir ni dar datos de contacto fuera de metoo en las primeras conversaciones.
                Si después decidís seguir hablando por otro sitio, es cosa vuestra, y fuera de
                aquí no podemos hacer nada.
              </li>
              <li>
                No hacerte pasar por otra persona, ni por un profesional, un hospital o una
                asociación.
              </li>
            </ul>
            <p className="mt-3">
              Las <Link href="/guidelines" className="text-foreground underline underline-offset-2">
                normas de la comunidad
              </Link>{' '}
              desarrollan esto y forman parte de estos términos. Están fechadas igual que este
              documento, y si cambian de forma importante te avisamos igual que de cualquier otro
              cambio (punto 9).
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
              En la medida en que nuestro papel respecto de ese contenido es meramente técnico y
              pasivo, nos acogemos al régimen de responsabilidad de los prestadores de servicios
              de alojamiento (art. 16 de la Ley 34/2002 y art. 6 del Reglamento (UE) 2022/2065):
              en cuanto tenemos conocimiento efectivo de un contenido ilícito o contrario a estas
              normas, lo retiramos o bloqueamos la cuenta con diligencia.
            </p>
            <p className="mt-3">
              Para avisarnos tienes el botón de reportar en cada conversación y en cada
              publicación, o{' '}
              <a
                href={`mailto:${TITULAR.email}`}
                className="text-foreground underline underline-offset-2"
              >
                {TITULAR.email}
              </a>
              . Cuéntanos por qué; el sitio exacto lo sabemos porque reportas desde la propia
              conversación. Te llegará un correo de acuse de recibo y otro cuando lo hayamos
              revisado.
            </p>
            <p className="mt-3">
              Conservas todos los derechos sobre lo que escribes. Solo nos autorizas, de forma no
              exclusiva, gratuita y sin derecho a cederlo a terceros —salvo a los proveedores
              técnicos que necesitamos para que esto funcione—, a alojarlo y mostrarlo dentro de
              metoo mientras siga publicado. Si lo borras o te das de baja, esa autorización se
              acaba, con la excepción de las guías que se explica abajo.
            </p>
            <p className="mt-3">
              Las <strong className="text-foreground">guías por hospital</strong> se leen sin
              cuenta, aunque pedimos a los buscadores que no las indexen. Al enviar una respuesta
              nos autorizas a publicarla ahí, sin tu alias ni enlace a tu perfil, y a mantenerla
              mientras no la retires: puedes pedirnos que la borremos en cualquier momento. Si te
              das de baja, se queda. Las guías no las escriben los hospitales ni los representan,
              y pueden estar desfasadas. No nombres en ellas a profesionales ni a otras personas
              concretas; lo que lo haga se oculta.
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
              Lo que se dice en metoo lo dicen sus usuarios, no nosotros. No controlamos lo que
              escriben ni cómo se comportan, y no respondemos de ello más allá de lo que nos
              obligue la ley. Tampoco respondemos de las decisiones que tomes sobre tu salud:
              metoo no es un servicio sanitario y así te lo decimos desde el principio (punto 3).
            </p>
            <p className="mt-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              Esta limitación tiene los límites que impone la ley y no pretende ir más allá. No se
              excluye en ningún caso la responsabilidad por dolo ni por negligencia grave, ni por
              los daños a la vida, la integridad física o la salud, ni ninguno de los derechos que
              te correspondan como consumidor, que siguen intactos. Si algún tribunal considerase
              nula alguna parte de esta cláusula, el resto seguirá siendo válido.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">8. Cuentas y suspensión</h2>
            <p>
              Podemos suspender o eliminar una cuenta que incumpla estas normas. Si es algo grave
              —acoso, amenazas, poner a alguien en peligro— puede ser de inmediato y sin aviso
              previo.
            </p>
            <p className="mt-3">
              Si suspendemos o eliminamos tu cuenta te diremos por qué, salvo que hacerlo pueda
              poner en peligro a alguien o estemos obligados a no decirlo. Puedes pedirnos que lo
              revisemos durante los seis meses siguientes escribiendo a {TITULAR.email}; la
              revisión la hace una persona, no un sistema automático.
            </p>
            <p className="mt-3">
              Puedes darte de baja tú, en cualquier momento y sin dar explicaciones, desde{' '}
              <strong className="text-foreground">Ajustes → Eliminar cuenta</strong>. Es
              inmediato y no se puede deshacer. Se va todo menos las conversaciones que tuviste,
              que le quedan a la otra persona durante un año como máximo; te lo contamos antes de
              borrar y con detalle en la{' '}
              <Link href="/privacidad" className="text-foreground underline underline-offset-2">
                política de privacidad
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">9. Cambios</h2>
            <p>
              Podemos actualizar estos términos. Si el cambio es importante te avisaremos por
              correo antes y te pediremos que lo aceptes la próxima vez que entres: hasta que no
              lo hagas, no los aplicamos contigo. Si no te convencen, puedes darte de baja sin
              ninguna consecuencia. Los cambios menores —corregir una errata, aclarar una frase—
              los publicamos actualizando la fecha de arriba.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">10. Cómo moderamos</h2>
            <p>
              No leemos las conversaciones de forma rutinaria ni hay nadie vigilando en tiempo
              real. Actuamos cuando alguien reporta algo o nos escribe. Según el caso, podemos
              ocultar un contenido, avisar a la persona, o suspender o eliminar la cuenta. Las
              decisiones las toma una persona, no un sistema automático.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">11. Ley aplicable</h2>
            <p>
              Se aplica la ley española. Si eres consumidor, puedes reclamar ante los juzgados de
              tu domicilio, y nada de lo anterior te quita esa opción.
            </p>
            <p className="mt-3">
              Antes de ir a un juzgado, escríbenos: casi todo se arregla hablando. Si no lo
              conseguimos, puedes acudir a los sistemas de resolución alternativa de conflictos de
              consumo que te correspondan.
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
