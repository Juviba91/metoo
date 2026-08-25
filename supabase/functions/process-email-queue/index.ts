import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
/** Secreto compartido con quien programe la invocación (cron). */
const CRON_SECRET = Deno.env.get('CRON_SECRET')

const BATCH_SIZE = 25

interface EmailQueueRow {
  id: string
  recipient_email: string
  subject: string
  html_body: string
  from_email: string
  retry_count: number
  max_retries: number
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Este endpoint provoca envío de correo: no puede quedar abierto.
  if (!CRON_SECRET) {
    console.error('CRON_SECRET not set')
    return new Response('Not configured', { status: 500 })
  }
  if (req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set')
    return new Response('Email API not configured', { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Devuelve a la cola lo que quedó reservado por una ejecución que murió
  const { error: requeueError } = await supabase.rpc('requeue_stuck_emails')
  if (requeueError) console.error('requeue_stuck_emails failed:', requeueError)

  const { data: pending, error: fetchError } = await supabase
    .from('email_queue')
    .select('id, recipient_email, subject, html_body, from_email, retry_count, max_retries')
    .eq('status', 'pending')
    .lte('next_retry_at', new Date().toISOString())
    .order('next_retry_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchError) {
    console.error('Error fetching pending emails:', fetchError)
    return new Response('Error fetching emails', { status: 500 })
  }

  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0, sent: 0, retrying: 0, failed: 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let retrying = 0
  let failed = 0

  for (const email of pending as EmailQueueRow[]) {
    // Reserva optimista: si otra ejecución ya se llevó esta fila, el update
    // no afecta a ninguna y la saltamos. Evita envíos duplicados.
    const { data: claimed } = await supabase
      .from('email_queue')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', email.id)
      .eq('status', 'pending')
      .select('id')

    if (!claimed || claimed.length === 0) continue

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: email.from_email,
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_body,
        }),
      })

      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)

      await supabase
        .from('email_queue')
        .update({ status: 'sent', error_message: null, updated_at: new Date().toISOString() })
        .eq('id', email.id)

      sent++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const nextRetryCount = email.retry_count + 1

      if (nextRetryCount >= email.max_retries) {
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: errorMessage,
            retry_count: nextRetryCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id)

        failed++
        console.error(`Email ${email.id} failed permanently: ${errorMessage}`)
      } else {
        // Backoff exponencial: 2m, 4m, 8m…
        const backoffMs = Math.pow(2, nextRetryCount) * 60_000

        await supabase
          .from('email_queue')
          .update({
            status: 'pending',
            retry_count: nextRetryCount,
            next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id)

        retrying++
      }
    }
  }

  return new Response(JSON.stringify({ processed: pending.length, sent, retrying, failed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
