import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacidad' }

/**
 * Datos del responsable del tratamiento.
 *
 * ⚠️ El RGPD (art. 13.1.a) exige identificar al responsable, y "el equipo de
 * metoo" no vale: hace falta el nombre de la persona física o la razón social.
 * Rellena NOMBRE y, si actúas como autónomo o entidad, también NIF y domicilio.
 * Es el único hueco de esta página que no se puede cerrar desde el código.
 */
const RESPONSABLE = {
  nombre: 'Juan Bayo', // ⚠️ COMPROBAR: nombre completo tal y como quieras que conste
  email: 'juan@bay-apps.com',
}

const ACTUALIZADA = 'septiembre de 2026'

export default function PrivacidadPage() {
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
        <h1 className="mb-2 text-3xl font-bold">Política de privacidad</h1>
        <p className="mb-10 text-sm text-muted-foreground">
          Última actualización: {ACTUALIZADA}
        </p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section className="rounded-xl border border-border bg-muted/40 p-5">
            <h2 className="mb-3 text-lg font-semibold text-foreground">En resumen</h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>Nadie ve tu nombre real. Eliges un alias y con eso basta.</li>
              <li>No vendemos ni cedemos tus datos. Nunca. No hay publicidad.</li>
              <li>
                Lo que cuentas aquí habla de tu salud, así que solo lo tratamos si tú
                nos das permiso al registrarte.
              </li>
              <li>
                <strong className="text-foreground">
                  Tus mensajes no van cifrados de extremo a extremo
                </strong>
                : quien administra la plataforma puede leerlos si hace falta moderar.
                Preferimos decírtelo a que lo supongas.
              </li>
              <li>Puedes borrarlo todo tú, cuando quieras, desde tu perfil.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              1. Quién trata tus datos
            </h2>
            <p>
              El responsable del tratamiento es {RESPONSABLE.nombre}, que mantiene metoo
              como proyecto sin ánimo de lucro. Puedes escribir para cualquier cosa
              relacionada con tus datos a{' '}
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
                pedimos tu nombre real, ni foto, ni fecha de nacimiento.
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
                <strong className="text-foreground">
                  Bloqueos, reportes y lo que nos escribes por la burbuja de feedback
                </strong>
                .
              </li>
              <li>
                <strong className="text-foreground">Datos técnicos</strong>: nuestro proveedor
                de alojamiento registra direcciones IP y datos de conexión en sus registros de
                servidor, por seguridad y para detectar abusos.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              3. Datos sobre tu salud
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
              al crear la cuenta y aceptar esta política. Puedes retirarlo cuando quieras
              eliminando tu cuenta, y no tienes que dar explicaciones. Retirarlo no afecta a lo
              que se hizo antes con tu permiso.
            </p>
            <p className="mt-3">
              Tú decides cuánto cuentas. Puedes usar metoo sin escribir nada en tu descripción
              y sin etiquetas.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              4. Para qué los usamos, y con qué derecho
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
                    <td className="py-2">Tu consentimiento explícito (art. 9.2.a)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Avisarte por correo de mensajes y solicitudes</td>
                    <td className="py-2">
                      Ejecución del servicio (art. 6.1.b). Puedes desactivarlos en tu perfil
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
              <strong className="text-foreground">
                No vendemos ni cedemos tus datos a nadie, ni hay publicidad, ni tomamos
                decisiones automatizadas sobre ti.
              </strong>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              5. Quién más los toca, y dónde están
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
              contractuales tipo aprobadas por la Comisión Europea, que forman parte del contrato
              con el proveedor. Te lo decimos porque tienes derecho a saberlo antes de
              registrarte.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              6. Cuánto tiempo los guardamos
            </h2>
            <ul className="ml-4 list-disc space-y-1.5">
              <li>
                Mientras tengas la cuenta abierta. Si la borras, tu perfil, tus conversaciones,
                tus publicaciones y tus contactos se eliminan en ese momento.
              </li>
              <li>
                Los reportes de moderación se conservan aunque te vayas, pero{' '}
                <strong className="text-foreground">sin quedar ligados a ti</strong>: se borra
                quién los hizo y sobre quién. Sirven para detectar patrones, no personas.
              </li>
              <li>
                Los registros técnicos de nuestros proveedores se conservan según sus propios
                plazos, normalmente unas semanas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">7. Cookies y analítica</h2>
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
            <h2 className="mb-3 text-lg font-semibold text-foreground">8. Tus derechos</h2>
            <p>
              <strong className="text-foreground">Borrar todo lo tuyo</strong> lo puedes hacer
              tú, ahora mismo y sin pedir permiso, desde{' '}
              <strong className="text-foreground">Mi perfil → Eliminar cuenta</strong>. Es
              inmediato y no se puede deshacer.
            </p>
            <p className="mt-3">
              También tienes derecho a acceder a tus datos, corregirlos, limitar u oponerte a su
              tratamiento, y a recibirlos en un formato que puedas llevarte. Para cualquiera de
              esas cosas escribe a{' '}
              <a
                href={`mailto:${RESPONSABLE.email}`}
                className="text-foreground underline underline-offset-2"
              >
                {RESPONSABLE.email}
              </a>
              . Respondemos como mucho en un mes.
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
              . Preferimos que nos escribas antes y lo arreglemos, pero es tu derecho y ahí
              está.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">9. Seguridad</h2>
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
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">10. Menores</h2>
            <p>
              metoo es para mayores de 16 años. Si detectamos una cuenta de alguien menor de esa
              edad, la eliminamos. Si eres madre, padre o tutor y crees que tu hijo o hija se ha
              registrado, escríbenos y lo resolvemos enseguida.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">11. Cambios</h2>
            <p>
              Si cambiamos algo importante de esta política te avisaremos por correo antes de
              que entre en vigor, para que puedas irte si no te convence. Los cambios menores se
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
