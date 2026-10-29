import webpush from 'web-push'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type AvisoPush = {
  titulo: string
  /** Nunca el contenido de un mensaje: el aviso se ve en la pantalla de bloqueo. */
  cuerpo: string
  url: string
  /** Avisos con la misma etiqueta se sustituyen en vez de apilarse. */
  etiqueta?: string
}

let configurado: boolean | null = null

function configurar(): boolean {
  if (configurado !== null) return configurado
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privada = process.env.VAPID_PRIVATE_KEY
  configurado = Boolean(publica && privada)
  if (configurado) webpush.setVapidDetails('mailto:juan@bay-apps.com', publica!, privada!)
  return configurado
}

/**
 * Manda un aviso push a todos los dispositivos de una cuenta.
 *
 * Se llama después de responder (con `after`), así que nunca retrasa ni rompe
 * la acción que lo dispara. Las suscripciones caducadas (404/410: la app se
 * desinstaló o se quitó el permiso) se borran al encontrarlas.
 */
export async function enviarPush(profileId: string, aviso: AvisoPush): Promise<void> {
  if (!configurar()) return
  const admin = createAdminClient()
  const { data: subs } = await admin
    .from('push_suscripciones')
    .select('id, endpoint, p256dh, auth')
    .eq('profile_id', profileId)

  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(aviso),
          { TTL: 60 * 60 * 24 },
        )
      } catch (e) {
        const codigo = (e as { statusCode?: number }).statusCode
        if (codigo === 404 || codigo === 410) {
          await admin.from('push_suscripciones').delete().eq('id', s.id)
        } else {
          console.error('push failed:', codigo, (e as Error).message)
        }
      }
    }),
  )
}

/** El alias de quien dispara el aviso (lo único de esa persona que sale en él). */
async function aliasDe(profileId: string): Promise<string> {
  const { data } = await createAdminClient().from('profiles').select('alias').eq('id', profileId).maybeSingle()
  return data?.alias ?? 'Alguien'
}

export async function avisarMensaje(connectionId: string, deId: string, paraId: string): Promise<void> {
  if (!configurar()) return
  const alias = await aliasDe(deId)
  await enviarPush(paraId, {
    titulo: 'Nuevo mensaje en metoo',
    cuerpo: `${alias} te ha escrito`,
    url: `/dashboard/chat/${connectionId}`,
    etiqueta: `chat-${connectionId}`,
  })
}

export async function avisarSolicitud(connectionId: string, deId: string, paraId: string): Promise<void> {
  if (!configurar()) return
  const alias = await aliasDe(deId)
  await enviarPush(paraId, {
    titulo: 'Alguien quiere hablar contigo',
    cuerpo: `${alias} te ha pedido contacto en metoo`,
    url: `/dashboard/chat/${connectionId}`,
    etiqueta: `chat-${connectionId}`,
  })
}

/**
 * Ejecuta un aviso cuando ya se ha respondido a la petición (`after`), sin
 * que un fallo del aviso afecte a nada. Fuera de una petición (tests,
 * scripts) `after` no existe: se lanza sin esperar.
 */
export function enSegundoPlano(tarea: () => Promise<void>): void {
  const segura = () => tarea().catch((e) => console.error('aviso en segundo plano:', e))
  try {
    after(segura)
  } catch {
    void segura()
  }
}
