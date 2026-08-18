import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL = Deno.env.get('APP_URL') ?? 'https://support-network-app.vercel.app'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const payload = await req.json()
  const connection = payload.record

  if (!connection?.id || !connection?.seeker_id || !connection?.volunteer_id) {
    return new Response('Missing fields', { status: 400 })
  }

  // Only notify on new pending connections
  if (connection.status !== 'pending') {
    return new Response('ok', { status: 200 })
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set')
    return new Response('Email not configured', { status: 200 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Get seeker alias
  const { data: seeker } = await supabase
    .from('profiles')
    .select('alias')
    .eq('id', connection.seeker_id)
    .single()

  // Get volunteer email
  const { data: { user: volunteer } } = await supabase.auth.admin.getUserById(connection.volunteer_id)
  if (!volunteer?.email) return new Response('No volunteer email', { status: 200 })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'metoo <hola@metoo.app>',
      to: volunteer.email,
      subject: `${seeker?.alias ?? 'Alguien'} quiere conectar contigo en metoo`,
      html: `
        <p>Hola,</p>
        <p><strong>${seeker?.alias ?? 'Alguien'}</strong> ha pedido contactar contigo en metoo.</p>
        <p>Entra a la app para aceptar o rechazar la solicitud.</p>
        <p><a href="${APP_URL}/dashboard">Ver solicitud →</a></p>
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
