import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { deliverEmail, escapeHtml } from '../_shared/email.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://metoonetwork.xyz'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'metoo <onboarding@resend.dev>'
const CRON_SECRET = Deno.env.get('CRON_SECRET')

/** No se vuelve a avisar a la misma persona antes de esto. */
const DIAS_ENTRE_AVISOS = 7

/**
 * Avisa a los voluntarios de que hay gente esperando.
 *
 * No es un boletín. Solo sale si hay alguien buscando apoyo a quien ese
 * voluntario podría acompañar; si no hay nadie, no se manda nada. La idea es
 * que un voluntario no se enfríe esperando una solicitud que nunca llega
 * mientras al otro lado hay gente que no encuentra a quien escribir.
 *
 * Deliberadamente NO dice quién está esperando: ni alias, ni ciudad, ni nada.
 * Solo cuántos y de qué hablan. Lo demás se ve entrando en la app.
 */
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Provoca envío de correo: no puede quedar abierta a internet.
  if (!CRON_SECRET) {
    console.error('CRON_SECRET not set')
    return new Response('Not configured', { status: 500 })
  }
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: candidatos, error } = await supabase.rpc('voluntarios_a_avisar', {
    p_dias: DIAS_ENTRE_AVISOS,
  })

  if (error) {
    console.error('voluntarios_a_avisar failed:', error)
    return new Response('Error', { status: 500 })
  }

  const filas = (candidatos ?? []) as {
    volunteer_id: string
    esperando: number
    etiquetas: string[]
  }[]

  let enviados = 0

  for (const fila of filas) {
    const { data: { user }, error: userError } =
      await supabase.auth.admin.getUserById(fila.volunteer_id)

    if (userError || !user?.email) {
      console.error('Sin correo para', fila.volunteer_id, userError)
      continue
    }

    const { data: perfil } = await supabase
      .from('profiles')
      .select('alias, digest_token')
      .eq('id', fila.volunteer_id)
      .single()

    const urlBaja = `${APP_URL}/baja/${perfil?.digest_token}`
    const gente = fila.esperando === 1 ? 'una persona' : `${fila.esperando} personas`
    const verbo = fila.esperando === 1 ? 'está buscando' : 'están buscando'

    // Las etiquetas las escriben usuarios: se escapan antes de ir al HTML.
    const etiquetas = (fila.etiquetas ?? [])
      .slice(0, 5)
      .map((e) => `#${escapeHtml(e)}`)
      .join(' · ')

    const result = await deliverEmail(supabase, RESEND_API_KEY, {
      to: user.email,
      from: FROM_EMAIL,
      // Sin `recipientUserId`: la preferencia que manda aquí es `digest_enabled`,
      // no la de avisos de mensajes. Ya la ha filtrado la consulta.
      subject:
        fila.esperando === 1
          ? 'Hay alguien esperando en metoo'
          : `Hay ${fila.esperando} personas esperando en metoo`,
      html: `
        <p>Hola,</p>
        <p>
          Ahora mismo ${gente} ${verbo} a alguien que haya pasado por lo que
          están pasando. Tú podrías ser esa persona.
        </p>
        ${etiquetas ? `<p style="color:#6b7280;">Hablan de: ${etiquetas}</p>` : ''}
        <p>
          No hace falta que digas nada especial. Con estar al otro lado, ya
          cambia bastante.
        </p>
        <p><a href="${APP_URL}/dashboard">Ver quién está esperando →</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;" />
        <p style="font-size:0.75rem;color:#9ca3af;">
          metoo — apoyo de quien ya pasó por lo mismo.<br />
          Este aviso sale como mucho una vez por semana, y solo cuando hay
          alguien esperando.
          <a href="${urlBaja}" style="color:#9ca3af;">Dejar de recibirlo</a>.
        </p>
      `,
    })

    if (result.status === 'sent') {
      enviados++
      // Se apunta solo si salió: si falló, que lo reintente la semana que viene
      // en vez de quedarse callado siete días.
      await supabase
        .from('profiles')
        .update({ last_digest_at: new Date().toISOString() })
        .eq('id', fila.volunteer_id)
    } else {
      console.error('Resumen no enviado a', fila.volunteer_id, result.error)
    }
  }

  return new Response(JSON.stringify({ candidatos: filas.length, enviados }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
