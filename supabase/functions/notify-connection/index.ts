import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { deliverEmail, escapeHtml } from '../_shared/email.ts'
import { hayBloqueo } from '../_shared/blocks.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://support-network-app.vercel.app'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'metoo <onboarding@resend.dev>'

const PIE = `
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;" />
  <p style="font-size:0.75rem;color:#9ca3af;">
    metoo — apoyo entre personas que lo han vivido.<br />
    Si no quieres recibir estos avisos, desactívalos en tu perfil.
  </p>
`

/**
 * Un único webhook sobre `connections` cubre las dos mitades de la conversación:
 *
 * - INSERT  → alguien pide apoyo. Se avisa al voluntario.
 * - UPDATE  → el voluntario acepta. Se avisa a quien lo pidió.
 *
 * Sin la segunda, quien pide apoyo no se entera de que le han aceptado hasta
 * que vuelve a abrir la app por su cuenta, que es justo lo que no va a hacer
 * quien está en mitad de un mal momento.
 */
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.json()
  const conexion = payload.record
  const anterior = payload.old_record

  if (!conexion?.id || !conexion?.seeker_id || !conexion?.volunteer_id) {
    return new Response('Missing fields', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // `type` lo manda el webhook de Supabase; si faltara, la ausencia de
  // `old_record` distingue igualmente un alta de una modificación.
  const esAlta = payload.type ? payload.type === 'INSERT' : !anterior

  if (esAlta && conexion.status === 'pending') {
    return await avisarSolicitud(supabase, conexion)
  }

  if (!esAlta && anterior?.status === 'pending' && conexion.status === 'accepted') {
    return await avisarAceptacion(supabase, conexion)
  }

  return new Response('ok', { status: 200 })
})

/** Solicitud nueva: se avisa al voluntario de que alguien le ha escrito. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function avisarSolicitud(supabase: any, conexion: any) {
  const { data: seeker, error: seekerError } = await supabase
    .from('profiles')
    .select('alias')
    .eq('id', conexion.seeker_id)
    .single()

  if (seekerError) {
    console.error('Seeker not found:', seekerError)
    return new Response('Seeker not found', { status: 200 })
  }

  const { data: { user: volunteer }, error: volunteerError } =
    await supabase.auth.admin.getUserById(conexion.volunteer_id)
  if (volunteerError || !volunteer?.email) {
    console.error('Volunteer not found:', volunteerError)
    return new Response('No volunteer email', { status: 200 })
  }

  const alias = seeker?.alias ?? 'Alguien'
  // El alias lo elige el usuario: se escapa antes de meterlo en el HTML
  const aliasSeguro = escapeHtml(alias)

  const result = await deliverEmail(supabase, RESEND_API_KEY, {
    to: volunteer.email,
    from: FROM_EMAIL,
    recipientUserId: conexion.volunteer_id,
    subject: `${alias} quiere conectar contigo en metoo`,
    html: `
      <p>Hola,</p>
      <p><strong>${aliasSeguro}</strong> ha pedido contactar contigo en metoo.</p>
      <p>Entra a la app para aceptar o rechazar la solicitud.</p>
      <p><a href="${APP_URL}/dashboard">Ver solicitud →</a></p>
      ${PIE}
    `,
  })

  if (result.status === 'queued') {
    console.error('Connection email queued for retry:', result.error)
  }

  return new Response('ok', { status: 200 })
}

/** El voluntario ha aceptado: se avisa a quien pidió el apoyo. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function avisarAceptacion(supabase: any, conexion: any) {
  // Si el voluntario acepta respondiendo, `sendMessage` inserta el mensaje
  // antes de marcar la conexión como aceptada. Cuando eso ha pasado, el correo
  // de mensaje nuevo ya cuenta lo mismo y además trae el texto: dos avisos
  // seguidos por lo mismo sobrarían.
  const { data: yaEscribio } = await supabase
    .from('messages')
    .select('id')
    .eq('connection_id', conexion.id)
    .eq('sender_id', conexion.volunteer_id)
    .limit(1)
    .maybeSingle()

  if (yaEscribio) return new Response('ya avisado por el mensaje', { status: 200 })

  if (await hayBloqueo(supabase, conexion.seeker_id, conexion.volunteer_id)) {
    return new Response('blocked', { status: 200 })
  }

  const { data: volunteer, error: volunteerError } = await supabase
    .from('profiles')
    .select('alias')
    .eq('id', conexion.volunteer_id)
    .single()

  if (volunteerError) {
    console.error('Volunteer profile not found:', volunteerError)
    return new Response('Volunteer not found', { status: 200 })
  }

  const { data: { user: seeker }, error: seekerError } =
    await supabase.auth.admin.getUserById(conexion.seeker_id)
  if (seekerError || !seeker?.email) {
    console.error('Seeker not found:', seekerError)
    return new Response('No seeker email', { status: 200 })
  }

  const alias = volunteer?.alias ?? 'Un voluntario'
  const aliasSeguro = escapeHtml(alias)
  const chatUrl = `${APP_URL}/dashboard/chat/${conexion.id}`

  const result = await deliverEmail(supabase, RESEND_API_KEY, {
    to: seeker.email,
    from: FROM_EMAIL,
    recipientUserId: conexion.seeker_id,
    subject: `${alias} ha aceptado acompañarte en metoo`,
    html: `
      <p>Hola,</p>
      <p><strong>${aliasSeguro}</strong> ha aceptado tu solicitud. Ya podéis hablar.</p>
      <p>No hay prisa ni forma correcta de empezar: cuenta lo que te apetezca contar.</p>
      <p><a href="${chatUrl}">Abrir la conversación →</a></p>
      ${PIE}
    `,
  })

  if (result.status === 'queued') {
    console.error('Acceptance email queued for retry:', result.error)
  }

  return new Response('ok', { status: 200 })
}
