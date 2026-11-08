const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/**
 * Los tests de Node importan este fichero (`escapeHtml`), y ahí `Deno` no
 * existe: leerlo en el nivel superior rompe la suite entera al importar. Se
 * consulta al usarlo y a través de `globalThis`.
 */
function variableDeEntorno(nombre: string): string | undefined {
  const runtime = globalThis as {
    Deno?: { env: { get(nombre: string): string | undefined } }
  }
  return runtime.Deno?.env.get(nombre)
}

/**
 * Los avisos salen desde el dominio de la app, que no recibe correo. Sin esto,
 * a quien conteste al aviso le rebota el mensaje — y en una app de apoyo,
 * contestar al correo es lo primero que hace mucha gente.
 */
export function remiteDeRespuesta(): string {
  return variableDeEntorno('REPLY_TO_EMAIL') ?? 'juan@bay-apps.com'
}

/**
 * El cliente llega ya construido desde cada función. Se tipa de forma laxa a
 * propósito: importar el tipo desde `jsr:` haría que este fichero no compilase
 * con el TypeScript del proyecto Next, que no resuelve ese especificador.
 */
type SupabaseLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

/** Escapa texto de usuario antes de interpolarlo en el HTML del email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface DeliverEmailArgs {
  to: string
  subject: string
  html: string
  from: string
  /** Perfil destinatario, para respetar su preferencia de notificaciones. */
  recipientUserId?: string
}

export interface DeliverResult {
  status: 'sent' | 'queued' | 'skipped'
  error?: string
}

/**
 * Intenta enviar el email de inmediato. Si Resend falla, lo deja en
 * `email_queue` para que `process-email-queue` lo reintente.
 *
 * El envío es directo a propósito: encolar sin enviar deja las notificaciones
 * paradas hasta que corra un cron, y una notificación de mensaje que llega
 * tarde no sirve de nada.
 */
export async function deliverEmail(
  supabase: SupabaseLike,
  apiKey: string | undefined,
  { to, subject, html: contenido, from, recipientUserId }: DeliverEmailArgs,
): Promise<DeliverResult> {
  // Todo lo que sale de aquí, dentro del marco común (y una sola vez).
  const html = plantillaCorreo(contenido)

  if (recipientUserId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_notifications_enabled')
      .eq('id', recipientUserId)
      .maybeSingle()

    if (profile && profile.email_notifications_enabled === false) {
      return { status: 'skipped' }
    }
  }

  if (!apiKey) {
    await queue(supabase, { to, subject, html, from }, 'RESEND_API_KEY not set')
    return { status: 'queued', error: 'RESEND_API_KEY not set' }
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, reply_to: remiteDeRespuesta() }),
    })

    if (res.ok) return { status: 'sent' }

    const detail = await res.text()
    await queue(supabase, { to, subject, html, from }, `Resend ${res.status}: ${detail}`)
    return { status: 'queued', error: detail }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await queue(supabase, { to, subject, html, from }, message)
    return { status: 'queued', error: message }
  }
}

async function queue(
  supabase: SupabaseLike,
  { to, subject, html, from }: Omit<DeliverEmailArgs, 'recipientUserId'>,
  errorMessage: string,
) {
  const { error } = await supabase.from('email_queue').insert({
    recipient_email: to,
    subject,
    html_body: html,
    from_email: from,
    status: 'pending',
    error_message: errorMessage,
    // Primer reintento en 2 minutos
    next_retry_at: new Date(Date.now() + 120_000).toISOString(),
  })

  if (error) console.error('Could not queue email:', error)
}

/**
 * Marca de que un correo ya va dentro de la plantilla. Los correos que se
 * encolan desde la base (`plantilla_correo` en SQL) llegan ya envueltos, y
 * los que fallan aquí y se reencolan también: sin la marca saldrían con dos
 * marcos uno dentro de otro.
 */
export const MARCA_PLANTILLA = '<!-- metoo-plantilla -->'

/**
 * El marco común de los correos: «metoo.» arriba, el contenido, y un pie con
 * el 112 y el enlace a los ajustes de avisos. Antes cada correo era un par de
 * párrafos sueltos, sin nada que dijera de dónde venían.
 *
 * Tablas y estilos en línea porque es lo que entienden todos los clientes de
 * correo. La misma plantilla está en SQL (`plantilla_correo`, migración
 * 20261114): si cambias una, cambia la otra.
 */
export function plantillaCorreo(html: string): string {
  if (html.includes(MARCA_PLANTILLA)) return html
  return (
    MARCA_PLANTILLA +
    '<div style="background:#faf7f5;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">' +
    '<style>a{color:#a85a34}</style>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #efe9e5;border-radius:14px">' +
    '<tr><td style="padding:28px 28px 8px">' +
    '<p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0a0a0a">metoo<span style="color:#a85a34">.</span></p>' +
    '<div style="font-size:15px;line-height:1.6;color:#262626">' +
    html +
    '</div></td></tr>' +
    '<tr><td style="padding:16px 28px 24px;border-top:1px solid #f3eeea;font-size:12px;line-height:1.5;color:#8a8a8a">' +
    'Apoyo de quien ya pasó por lo mismo · ' +
    '<a href="https://www.metoonetwork.xyz/dashboard/ajustes" style="color:#8a8a8a">Ajustes de avisos</a><br>' +
    'En una emergencia, llama al 112.' +
    '</td></tr></table></div>'
  )
}
