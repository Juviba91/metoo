import Link from 'next/link'
import { SiteHeaderPublic } from '@/components/site-header-public'
import { TEXTOS_ACTUALIZADOS } from '@/lib/legal'
import { TITULAR as RESPONSABLE } from '@/lib/titular'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacidad' }

/*
 * Revisada en octubre de 2026 con la nota legal de Mas Calvet. Cada promesa de
 * aquí tiene que ser verdad en el código: si cambias una, cambia la otra (ver
 * CLAUDE.md). Lo que la nota proponía y aún no existe —registro de accesos del
 * administrador, acuse de recibo de reportes, retirar el permiso sin borrar la
 * cuenta— NO se promete.
 */

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeaderPublic showAuth={false} ancho="max-w-3xl" />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold">Política de privacidad</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Última actualización: {TEXTOS_ACTUALIZADOS}
        </p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section className="rounded-xl border border-border bg-muted/40 p-5">
            <h2 className="mb-3 text-lg font-semibold text-foreground">En resumen</h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Nadie ve tu nombre real. Eliges un alias y con eso basta.</li>
              <li>No vendemos ni cedemos tus datos. Nunca. No hay publicidad.</li>
              <li>
                Lo que cuentas aquí habla de tu salud, así que solo lo tratamos si nos das
                permiso aparte, con una casilla propia.
              </li>
              <li>
                <strong className="text-foreground">
                  Tus mensajes no van cifrados de extremo a extremo
                </strong>
                : quien administra la plataforma puede leerlos si hace falta moderar.
                Preferimos decírtelo a que lo supongas.
              </li>
              <li>
                Puedes darte de baja tú, cuando quieras, desde Ajustes. Lo único que sobrevive
                es lo que escribiste en las guías, sin firma (punto 3), y tus conversaciones,
                que le quedan a la otra persona durante un año como máximo; después se borran
                solas (punto 7).
              </li>
              <li>
                Las guías por hospital se leen sin cuenta, pero lo que escribes en ellas sale
                sin tu alias y sin enlace a tu perfil, y pedimos a los buscadores que no las
                indexen (punto 3).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              1. Quién trata tus datos
            </h2>
            <p>
              El responsable del tratamiento es la {RESPONSABLE.nombre}, con NIF{' '}
              {RESPONSABLE.nif} y domicilio en {RESPONSABLE.domicilio}, inscrita en el{' '}
              {RESPONSABLE.registro}. metoo es un proyecto sin ánimo de lucro de la
              asociación. Puedes escribir para cualquier cosa relacionada con tus datos a{' '}
              <a
                href={`mailto:${RESPONSABLE.email}`}
                className="text-foreground underline underline-offset-2"
              >
                {RESPONSABLE.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              2. Qué datos recogemos
            </h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                <strong className="text-foreground">Tu correo y tu contraseña</strong>: para
                entrar en la cuenta. El correo no se lo mostramos a nadie. La contraseña no la
                guardamos: se guarda un resumen cifrado del que no se puede volver atrás.
              </li>
              <li>
                <strong className="text-foreground">Tu alias</strong>: el que tú elijas. No
                pedimos tu nombre real ni foto.
              </li>
              <li>
                <strong className="text-foreground">Tu fecha de nacimiento, solo un momento</strong>:
                te la pedimos al registrarte para comprobar que tienes al menos 16 años.{' '}
                <strong className="text-foreground">No la guardamos</strong>: solo anotamos que la
                comprobación se superó y cuándo.
              </li>
              <li>
                <strong className="text-foreground">Tu ciudad</strong>: para poder conectarte
                con gente cerca. No pedimos dirección ni hospital concreto, y es a propósito:
                en un sitio pequeño, el hospital identifica a una persona.
              </li>
              <li>
                <strong className="text-foreground">
                  Tu descripción, tus etiquetas, tu etapa y cómo prefieres acompañar
                </strong>
                : lo que rellenas en el perfil.
              </li>
              <li>
                <strong className="text-foreground">Tus conversaciones</strong>: los mensajes
                que intercambias, y con quién y cuándo.
              </li>
              <li>
                <strong className="text-foreground">Lo que publicas en el feed</strong> y las
                reacciones que dejas.
              </li>
              <li>
                <strong className="text-foreground">Lo que escribes en las guías</strong>, con el
                hospital y el tema al que se refieren (punto 3).
              </li>
              <li>
                <strong className="text-foreground">Cuándo aceptaste estos textos y cuándo nos
                diste permiso para tratar datos de salud</strong>, y qué versión era en cada caso,
                para poder demostrar que diste tu consentimiento.
              </li>
              <li>
                <strong className="text-foreground">
                  Bloqueos, reportes y lo que nos escribes por la burbuja de feedback
                </strong>
                .
              </li>
              <li>
                <strong className="text-foreground">Si activas los avisos en el móvil</strong>, la
                dirección que da tu navegador para mandártelos. Los avisos dicen quién te ha escrito,
                nunca lo que te ha escrito. Se borra al desactivarlos o al darte de baja.
              </li>
              <li>
                <strong className="text-foreground">Los temas en los que pides aviso</strong> cuando
                todavía no hay nadie que acompañe, para escribirte cuando llegue alguien. Se borran
                si quitas el aviso o te das de baja.
              </li>
              <li>
                <strong className="text-foreground">
                  Si acompañas, cuándo leíste la guía de cómo acompañar
                </strong>
                , para poder demostrar que la tuviste delante.
              </li>
              <li>
                <strong className="text-foreground">Datos técnicos</strong>: Vercel, nuestro
                proveedor de alojamiento, y Supabase, el de la base de datos, registran
                direcciones IP y datos de conexión en sus registros de servidor, por seguridad y
                para detectar abusos (plazos en el punto 7).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              3. Las guías por hospital
            </h2>
            <p>
              Las guías son lo único de metoo que se puede leer sin tener cuenta, y por eso van
              aparte: lo que escribes ahí no es privado.
            </p>
            <ul className="ml-4 mt-3 list-disc space-y-1.5">
              <li>
                <strong className="text-foreground">Qué se publica:</strong> tus respuestas a las
                preguntas de la guía, el hospital y el tema al que se refieren, y si ya pasaste por
                ello o lo estás viviendo.{' '}
                <strong className="text-foreground">
                  No se publica tu alias ni ningún enlace a tu perfil
                </strong>
                : las respuestas salen sin firma. Quién escribió cada una lo guardamos solo para
                poder moderar.
              </li>
              <li>
                <strong className="text-foreground">Quién lo ve:</strong> cualquiera, con o sin
                cuenta. Hemos pedido a los buscadores que no indexen estas páginas, aunque no
                podemos garantizar al cien por cien que ninguno las recoja.
              </li>
              <li>
                <strong className="text-foreground">Cuándo lo sabes:</strong> te lo recordamos en
                la pantalla donde escribes, y tienes que marcar una casilla antes de enviar nada.
              </li>
              <li>
                <strong className="text-foreground">Si te das de baja:</strong> tus respuestas se
                quedan, y ya ni siquiera nosotros sabemos de quién eran. Si prefieres que se
                borren, escríbenos antes y las borramos.
              </li>
              <li>
                <strong className="text-foreground">Moderación:</strong> no las revisamos antes de
                que salgan. Ocultamos lo que incumple las normas cuando lo sabemos.
              </li>
            </ul>
            <p className="mt-3">
              <strong className="text-foreground">Ten en cuenta una cosa importante:</strong>{' '}
              aunque no aparezca tu alias, la combinación del hospital, el tema y el momento en
              que lo cuentas puede bastar para que alguien de tu entorno te reconozca, sobre todo
              si el hospital es pequeño. Escribe pensando en eso: nada que te identifique, ni
              nombres de personas del hospital, y nada sobre tratamientos.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              4. Datos sobre tu salud
            </h2>
            <p>
              Esto merece un apartado propio, porque es lo más delicado que hay aquí.
            </p>
            <p className="mt-3">
              Tus etiquetas, tu descripción y lo que escribes en los chats pueden revelar
              información sobre tu salud, la de tu familia o un duelo. El Reglamento General de
              Protección de Datos considera esa información una{' '}
              <strong className="text-foreground">categoría especial</strong> (artículo 9) y
              exige más cuidado con ella.
            </p>
            <p className="mt-3">
              La tratamos únicamente con tu{' '}
              <strong className="text-foreground">consentimiento explícito</strong>, que nos das
              marcando una casilla propia al crear la cuenta, separada de la aceptación de esta
              política. Guardamos cuándo lo diste y con qué versión de los textos. Sin ese
              permiso no se puede usar metoo, porque todo lo que hace —encontrar a alguien que
              vivió lo mismo— parte de lo que cuentas. Puedes retirarlo cuando quieras
              eliminando tu cuenta o escribiéndonos, sin dar explicaciones. Retirarlo no afecta a
              lo que se hizo antes con tu permiso.
            </p>
            <p className="mt-3">
              Con una excepción que te decimos por delante: los mensajes que ya enviaste se
              quedan con la persona que los recibió durante un año desde tu baja, porque la
              conversación también es suya (punto 7). Pasado ese plazo se borran
              automáticamente. Si hay algo concreto que necesitas que desaparezca antes,
              escríbenos y lo miramos uno por uno.
            </p>
            <p className="mt-3">
              Lo mismo vale para lo que publiques en las guías (punto 3), con una diferencia: ahí
              lo lee cualquiera, aunque sin tu firma. Antes de escribir te lo recordamos y tienes
              que marcar que lo has entendido.
            </p>
            <p className="mt-3">
              Tú decides cuánto cuentas. Puedes usar metoo sin escribir nada en tu descripción
              y sin etiquetas.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              5. Para qué los usamos, y con qué derecho
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-semibold text-foreground">Para qué</th>
                    <th className="py-2 font-semibold text-foreground">Base legal</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Crear tu cuenta y dejarte entrar</td>
                    <td className="py-2">Ejecución del servicio que nos pides (art. 6.1.b)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      Enseñar tu perfil al rol contrario y conectarte con alguien
                    </td>
                    <td className="py-2">Ejecución del servicio (art. 6.1.b)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      Tratar lo que revela tu salud (etiquetas, descripción, mensajes)
                    </td>
                    <td className="py-2">Tu consentimiento explícito (arts. 6.1.a y 9.2.a)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Avisarte por correo de mensajes y solicitudes</td>
                    <td className="py-2">
                      Interés legítimo en que te enteres de que alguien te ha escrito (art.
                      6.1.f). Puedes desactivarlos en Ajustes
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      Si buscas apoyo, avisarte de vez en cuando (como mucho cada dos semanas) de
                      que en tu tema hay alguien disponible con quien aún no has hablado
                    </td>
                    <td className="py-2">
                      Interés legítimo en que encuentres apoyo (art. 6.1.f). Se desactiva con los
                      avisos por correo de Ajustes
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      Avisarte cuando llegue alguien que acompañe en un tema que lo pediste
                    </td>
                    <td className="py-2">Tu consentimiento, al pulsar «Avísame» (art. 6.1.a)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      Confirmarte que recibimos un reporte y que lo hemos revisado
                    </td>
                    <td className="py-2">
                      Cumplir una obligación legal (art. 6.1.c, en relación con el art. 16 del
                      Reglamento de Servicios Digitales)
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      Publicar tus respuestas en las guías por hospital
                    </td>
                    <td className="py-2">
                      Tu consentimiento (arts. 6.1.a y 9.2.a), que das al marcar el aviso y
                      enviar cada respuesta
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Comprobar que tienes al menos 16 años</td>
                    <td className="py-2">
                      Cumplir una obligación legal (art. 6.1.c, en relación con el art. 8 RGPD y
                      el art. 7 de la LOPDGDD)
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">
                      Guardar cuándo aceptaste estos textos y qué versión era
                    </td>
                    <td className="py-2">
                      Poder demostrar tu consentimiento (art. 7.1) y defendernos ante una
                      reclamación (art. 6.1.f)
                    </td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Moderar, atender reportes y evitar abusos</td>
                    <td className="py-2">
                      Interés legítimo en que esto sea un sitio seguro (art. 6.1.f)
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Contar visitas de forma agregada</td>
                    <td className="py-2">Interés legítimo en saber si la app funciona (art. 6.1.f)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Los correos de aviso dicen quién te ha escrito, pero nunca lo que te dice: el
              contenido de los mensajes no sale de la app. Los avisos se pueden desactivar en
              Ajustes.
            </p>
            <p className="mt-4">
              <strong className="text-foreground">
                No vendemos ni cedemos tus datos a nadie, ni hay publicidad, ni tomamos
                decisiones automatizadas sobre ti.
              </strong>
            </p>
            <p className="mt-4">
              <strong className="text-foreground">Cómo te proponemos a alguien.</strong> No hay
              algoritmo ni puntuación: te enseñamos a las personas disponibles del otro lado en
              tus temas, y eres tú quien filtra por tema o ciudad y decide. Nadie te empareja con
              nadie.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              6. Quién más los toca, y dónde están
            </h2>
            <p>
              metoo no tiene servidores propios. Para funcionar se apoya en tres proveedores,
              que tratan los datos por cuenta nuestra y no pueden usarlos para otra cosa:
            </p>
            <ul className="ml-4 mt-3 list-disc space-y-1.5">
              <li>
                <strong className="text-foreground">Supabase</strong> — la base de datos y las
                cuentas. Aquí viven tu perfil y tus mensajes.
              </li>
              <li>
                <strong className="text-foreground">Vercel</strong> — el alojamiento de la web.
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> — el envío de los correos
                de aviso. Sus servidores están en la Unión Europea.
              </li>
            </ul>
            <p className="mt-4">
              <strong className="text-foreground">Transferencia fuera de Europa.</strong> La
              base de datos está alojada en Estados Unidos (región{' '}
              <code className="text-xs">us-east-1</code>). Eso significa que tus datos salen del
              Espacio Económico Europeo. La transferencia se ampara en las cláusulas
              contractuales tipo aprobadas por la Decisión de Ejecución (UE) 2021/914 de la
              Comisión (módulo de responsable a encargado), que forman parte del contrato con
              Supabase. Puedes pedirnos copia escribiendo a {RESPONSABLE.email}.
            </p>
            <p className="mt-3">
              Vercel y Resend son empresas estadounidenses. En la medida en que sus equipos
              puedan acceder a los datos desde Estados Unidos, esos accesos están cubiertos por
              las mismas cláusulas contractuales tipo.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              7. Cuánto tiempo los guardamos
            </h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                Mientras tengas la cuenta abierta. Si la borras, se eliminan en ese momento tu
                acceso, tu perfil, tus publicaciones y tus contactos.
              </li>
              <li>
                <strong className="text-foreground">Tus conversaciones no se borran de
                inmediato</strong>, y es importante que lo sepas antes de darte de baja. A la
                persona con la que hablabas le queda el hilo entero, con tu alias, marcado como
                cuenta eliminada,{' '}
                <strong className="text-foreground">durante un año desde tu baja</strong>; pasado
                ese plazo se borra entero, automáticamente. Una conversación es de dos: borrarla
                por un lado le dejaría a la otra persona un hueco sin explicación, y en esta app
                eso duele. Pero tampoco tiene sentido guardarla para siempre, así que le ponemos
                fecha. Del resto de tu ficha solo sobrevive el alias —ni tu descripción, ni tu
                ciudad, ni tus etiquetas— y nadie puede escribirte ya.
              </li>
              <li>
                <strong className="text-foreground">Tus respuestas en las guías</strong> se
                quedan, sin firma y sin que quede guardado de quién eran (punto 3). Si quieres que
                se borren, escríbenos antes de darte de baja.
              </li>
              <li>
                Los reportes de moderación, lo que nos escribes por la burbuja de feedback y tus
                sugerencias de etiquetas se conservan aunque te vayas, pero{' '}
                <strong className="text-foreground">sin quedar ligados a ti</strong>: se borra
                quién los hizo, sobre quién y en qué conversación. Sirven para detectar patrones,
                no personas.
              </li>
              <li>
                Las fechas en que aceptaste estos textos y diste el permiso de salud, y sus
                versiones, se conservan en la ficha que queda tras la baja, para poder demostrar
                tu consentimiento si alguien lo discute.
              </li>
              <li>
                Los registros técnicos los conservan nuestros proveedores según sus propios
                plazos, que no fijamos nosotros. Con el plan que tenemos contratado, los de Vercel
                se guardan una hora y los de Supabase un día. No los copiamos ni los guardamos
                aparte.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">8. Cookies y analítica</h2>
            <p>
              Usamos cookies estrictamente necesarias para mantener tu sesión abierta. No hay
              cookies de rastreo ni de publicidad, así que no verás ningún banner pidiéndote
              permiso: no hace falta.
            </p>
            <p className="mt-3">
              Para saber cuántas visitas recibe cada página usamos Vercel Analytics. No usa
              cookies, no crea un identificador que te siga entre visitas y no recoge nada de lo
              que escribes: solo cuenta páginas vistas de forma agregada.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">9. Tus derechos</h2>
            <p>
              <strong className="text-foreground">Darte de baja</strong> lo puedes hacer tú,
              ahora mismo y sin pedir permiso, desde{' '}
              <strong className="text-foreground">Ajustes → Eliminar cuenta</strong>. Es
              inmediato y no se puede deshacer. Se va todo menos las conversaciones, por lo que
              te contamos en el punto 7; si quieres que también se borre alguna, escríbenos y lo
              vemos caso por caso.
            </p>
            <p className="mt-3">
              También puedes pedirnos que borremos datos concretos sin cerrar la cuenta —una
              etiqueta, una publicación, una respuesta en una guía—, y retirar tu consentimiento
              en cualquier momento. Y tienes derecho a acceder a tus datos, corregirlos, limitar
              u oponerte a su tratamiento, y a recibirlos en un formato que puedas llevarte. Para
              cualquiera de esas cosas escribe a{' '}
              <a
                href={`mailto:${RESPONSABLE.email}`}
                className="text-foreground underline underline-offset-2"
              >
                {RESPONSABLE.email}
              </a>
              . Respondemos como mucho en un mes; si el caso es complicado, ese plazo se puede
              alargar dos meses más, y te lo diríamos dentro del primero.
            </p>
            <p className="mt-3">
              Si crees que no hemos hecho bien nuestro trabajo, puedes reclamar ante la{' '}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Agencia Española de Protección de Datos
              </a>
              {' '}(C/ Jorge Juan 6, 28001 Madrid; www.aepd.es). Preferimos que nos escribas
              antes y lo arreglemos, pero es tu derecho y ahí está.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">10. Seguridad</h2>
            <p>
              Las conexiones van por HTTPS y los datos están cifrados en reposo en los
              servidores de nuestros proveedores. Cada persona solo puede leer sus propias
              conversaciones: lo impone la propia base de datos, no solo la aplicación.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">
                Ahora la parte que casi nadie cuenta:
              </strong>{' '}
              los mensajes no están cifrados de extremo a extremo. Quien administra la
              plataforma tiene acceso técnico a la base de datos y puede leer conversaciones si
              hace falta atender un reporte o investigar un abuso. No se hace por curiosidad y
              no se hace de forma rutinaria, pero es posible, y creemos que mereces saberlo
              antes de contar algo íntimo.
            </p>
            <p className="mt-3">
              Si alguna vez hubiera una brecha de seguridad que pueda afectarte, te avisaremos
              sin demora y se lo comunicaremos a la Agencia Española de Protección de Datos en
              el plazo de 72 horas.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">11. Menores</h2>
            <p>
              metoo es para mayores de 16 años. Al registrarte te pedimos tu fecha de nacimiento
              y, si no llegas a esa edad, no puedes crear la cuenta (y ese navegador se queda
              bloqueado un día, para que no baste con cambiar el año). Nadie puede comprobar del
              todo la edad de quien escribe desde el otro lado, así que además revisamos los
              avisos que nos llegan: si detectamos una cuenta de alguien menor de 16 años, la
              eliminamos. Si eres madre, padre o tutor y crees que tu hijo o hija se ha
              registrado, escríbenos y lo resolvemos enseguida.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">12. Cambios</h2>
            <p>
              Si cambiamos algo importante de esta política te avisaremos por correo antes de
              que entre en vigor, para que puedas irte si no te convence, y{' '}
              <strong className="text-foreground">
                te pediremos que la aceptes de nuevo la próxima vez que entres
              </strong>
              : seguir usando la app sin más no vale como aceptación, y menos para el permiso
              sobre tus datos de salud. Los cambios menores —una errata, una frase más clara— se
              reflejan en la fecha de arriba.
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
