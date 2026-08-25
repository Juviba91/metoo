import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { deliverEmail, escapeHtml } from '../_shared/email.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://support-network-app.vercel.app'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'metoo <onboarding@resend.dev>'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.json()
  const message = payload.record

  if (!message?.connection_id || !message?.sender_id || !message?.content) {
    return new Response('Missing fields', { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: conn } = await supabase
    .from('connections')
    .select('seeker_id, volunteer_id')
    .eq('id', message.connection_id)
    .single()

  if (!conn) return new Response('Connection not found', { status: 200 })

  const recipientId =
    conn.seeker_id === message.sender_id ? conn.volunteer_id : conn.seeker_id

  const { data: sender, error: senderError } = await supabase
    .from('profiles')
    .select('alias')
    .eq('id', message.sender_id)
    .single()

  if (!sender || senderError) {
    console.error('Sender not found:', senderError)
    return new Response('Sender not found', { status: 200 })
  }

  const { data: { user: recipientUser }, error: recipientError } = await supabase.auth.admin.getUserById(recipientId)
  if (recipientError || !recipientUser?.email) {
    console.error('Recipient not found:', recipientError)
    return new Response('No recipient email', { status: 200 })
  }

  const chatUrl = `${APP_URL}/dashboard/chat/${message.connection_id}`
  const senderAlias = sender.alias ?? 'Alguien'
  const rawPreview =
    message.content.substring(0, 200) + (message.content.length > 200 ? '…' : '')
  // Contenido escrito por usuarios: se escapa antes de meterlo en el HTML
  const preview = escapeHtml(rawPreview)
  const safeAlias = escapeHtml(senderAlias)

  const result = await deliverEmail(supabase, RESEND_API_KEY, {
    to: recipientUser.email,
    from: FROM_EMAIL,
    recipientUserId: recipientId,
    subject: `${senderAlias} te ha enviado un mensaje en metoo`,
    html: `
      <p>Hola,</p>
      <p><strong>${safeAlias}</strong> te ha enviado un mensaje en metoo:</p>
      <blockquote style="border-left:3px solid #e5e7eb;padding-left:1rem;color:#6b7280;">
        ${preview}
      </blockquote>
      <p><a href="${chatUrl}">Ver conversación →</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;" />
      <p style="font-size:0.75rem;color:#9ca3af;">
        metoo — apoyo entre personas que lo han vivido.<br />
        Si no quieres recibir estos avisos, desactívalos en tu perfil.
      </p>
    `,
  })

  if (result.status === 'queued') {
    console.error('Message email queued for retry:', result.error)
  }

  return new Response('ok', { status: 200 })
})
