import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

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
  supabase: SupabaseClient,
  apiKey: string | undefined,
  { to, subject, html, from, recipientUserId }: DeliverEmailArgs,
): Promise<DeliverResult> {
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
      body: JSON.stringify({ from, to, subject, html }),
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
  supabase: SupabaseClient,
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
