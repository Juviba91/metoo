import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { deliverEmail, escapeHtml } from '../_shared/email.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://metoonetwork.xyz'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'metoo <onboarding@resend.dev>'
/** A quién le llega lo que escribe la gente. */
const FEEDBACK_EMAIL = Deno.env.get('FEEDBACK_EMAIL') ?? 'juan@bay-apps.com'

/**
 * Avisa por correo de lo que escribe la gente desde la app: la burbuja de
 * feedback y las sugerencias de hashtag.
 *
 * Antes esto caía en una tabla que no se mira desde ninguna pantalla. Alguien
 * se tomaba la molestia de contarte que algo no funciona, la app le contestaba
 * "lo leeremos con atención", y no lo leía nadie.
 *
 * Un solo webhook por tabla, misma función: lo único que cambia es de qué
 * columna sale el texto.
 */
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.json()
  const fila = payload.record
  const tabla = payload.table

  const texto = tabla === 'hashtag_suggestions' ? fila?.suggestion : fila?.content
  if (!texto) return new Response('Missing fields', { status: 400 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // El perfil puede faltar: `feedback.profile_id` es SET NULL, así que lo que
  // escribió alguien que luego borró su cuenta sigue aquí, sin autor.
  let alias = 'Alguien'
  if (fila.profile_id) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('alias')
      .eq('id', fila.profile_id)
      .maybeSingle()
    if (perfil?.alias) alias = perfil.alias
  }

  const esSugerencia = tabla === 'hashtag_suggestions'
  const titulo = esSugerencia ? 'Sugerencia de hashtag' : 'Feedback nuevo'

  // Texto escrito por usuarios: se escapa antes de meterlo en el HTML. Los
  // saltos de línea se conservan, que si alguien escribe tres párrafos no
  // llegue todo pegado.
  const seguro = escapeHtml(texto).replace(/\n/g, '<br />')

  const result = await deliverEmail(supabase, RESEND_API_KEY, {
    to: FEEDBACK_EMAIL,
    from: FROM_EMAIL,
    // Sin `recipientUserId`: esto va al buzón de quien mantiene la app, no a
    // un usuario, así que no le aplica la preferencia de notificaciones.
    subject: `${titulo} en metoo — ${escapeHtml(alias)}`,
    html: `
      <p><strong>${escapeHtml(alias)}</strong> ha escrito desde la app:</p>
      <blockquote style="border-left:3px solid #e5e7eb;padding-left:1rem;color:#374151;">
        ${seguro}
      </blockquote>
      <p><a href="${APP_URL}/admin">Ver en el panel →</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;" />
      <p style="font-size:0.75rem;color:#9ca3af;">
        Aviso automático de metoo. Este correo no lo recibe ningún usuario.
      </p>
    `,
  })

  if (result.status === 'queued') {
    console.error('Feedback email queued for retry:', result.error)
  }

  return new Response('ok', { status: 200 })
})
