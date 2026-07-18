import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  // Database webhooks send a POST with the record payload
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.json()
  const message = payload.record

  if (!message?.connection_id || !message?.sender_id || !message?.content) {
    return new Response('Missing fields', { status: 400 })
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set')
    return new Response('Email not configured', { status: 200 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Find the connection and both participants
  const { data: conn } = await supabase
    .from('connections')
    .select('seeker_id, volunteer_id')
    .eq('id', message.connection_id)
    .single()

  if (!conn) return new Response('Connection not found', { status: 200 })

  // Recipient is whoever is NOT the sender
  const recipientId =
    conn.seeker_id === message.sender_id ? conn.volunteer_id : conn.seeker_id

  // Get sender alias
  const { data: sender } = await supabase
    .from('profiles')
    .select('alias')
    .eq('id', message.sender_id)
    .single()

  // Get recipient email from auth.users (requires service role)
  const { data: { user: recipientUser } } = await supabase.auth.admin.getUserById(recipientId)
  if (!recipientUser?.email) return new Response('No recipient email', { status: 200 })

  // Send via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'metoo <hola@metoo.app>',
      to: recipientUser.email,
      subject: `${sender?.alias ?? 'Alguien'} te ha enviado un mensaje en metoo`,
      html: `
        <p>Hola,</p>
        <p><strong>${sender?.alias ?? 'Alguien'}</strong> te ha enviado un mensaje en metoo:</p>
        <blockquote style="border-left:3px solid #e5e7eb;padding-left:1rem;color:#6b7280;">
          ${message.content.substring(0, 200)}${message.content.length > 200 ? '…' : ''}
        </blockquote>
        <p><a href="https://metoo.app/dashboard/chat/${message.connection_id}">Ver conversación →</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;" />
        <p style="font-size:0.75rem;color:#9ca3af;">
          metoo — apoyo entre personas que lo han vivido.<br />
          Si no quieres recibir estos avisos, desactívalos en tu perfil.
        </p>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
  }

  return new Response('ok', { status: 200 })
})
