import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailQueueRow {
  id: string
  recipient_email: string
  subject: string
  html_body: string
  from_email: string
  retry_count: number
  max_retries: number
  next_retry_at: string
  error_message: string | null
  status: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set')
    return new Response('Email API not configured', { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Get pending emails that are ready to send
  const { data: pendingEmails, error: fetchError } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('next_retry_at', new Date().toISOString())
    .limit(50)

  if (fetchError) {
    console.error('Error fetching pending emails:', fetchError)
    return new Response('Error fetching emails', { status: 500 })
  }

  if (!pendingEmails || pendingEmails.length === 0) {
    return new Response('No pending emails', { status: 200 })
  }

  let sent = 0
  let failed = 0

  for (const email of pendingEmails as EmailQueueRow[]) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: email.from_email,
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_body,
        }),
      })

      if (res.ok) {
        // Email sent successfully
        await supabase
          .from('email_queue')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', email.id)

        sent++
        console.log(`Email sent to ${email.recipient_email}`)
      } else {
        const errorText = await res.text()
        throw new Error(`Resend API error: ${errorText}`)
      }
    } catch (error) {
      failed++
      const errorMessage = error instanceof Error ? error.message : String(error)
      const nextRetryCount = email.retry_count + 1

      if (nextRetryCount >= email.max_retries) {
        // Max retries exceeded, mark as failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: errorMessage,
            retry_count: nextRetryCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id)

        console.error(`Email to ${email.recipient_email} failed after ${email.max_retries} retries: ${errorMessage}`)
      } else {
        // Schedule retry with exponential backoff
        const backoffSeconds = Math.pow(2, nextRetryCount) * 60 // 2m, 4m, 8m
        const nextRetryAt = new Date(Date.now() + backoffSeconds * 1000)

        await supabase
          .from('email_queue')
          .update({
            retry_count: nextRetryCount,
            next_retry_at: nextRetryAt.toISOString(),
            error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', email.id)

        console.log(`Email to ${email.recipient_email} retry scheduled in ${backoffSeconds}s (attempt ${nextRetryCount}/${email.max_retries})`)
      }
    }
  }

  return new Response(
    JSON.stringify({
      processed: pendingEmails.length,
      sent,
      failed,
      message: `Processed ${pendingEmails.length} emails (${sent} sent, ${failed} retrying)`,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
