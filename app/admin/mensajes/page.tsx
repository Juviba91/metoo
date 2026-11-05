import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SiteHeader } from '@/components/site-header'
import { hilosDeEquipo, NOMBRE_EQUIPO } from '@/lib/equipo'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chats admin' }

const ADMIN_EMAIL = 'baygual91@gmail.com'

/**
 * Tu bandeja: una conversación por persona, con todas las que hay en metoo.
 * Primero a quien le debes respuesta, luego las conversaciones abiertas y, al
 * final, quienes aún no han hablado con el equipo (por si quieres escribirles tú).
 */
export default async function MensajesEquipoPage() {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const admin = createAdminClient()
  const [{ data: perfiles }, { data: mensajes }] = await Promise.all([
    admin.from('profiles').select('id, alias, role, city').is('deleted_at', null).limit(1000),
    admin
      .from('mensajes_equipo')
      .select('usuario_id, del_equipo, contenido, creado_en')
      .order('creado_en', { ascending: false })
      .limit(5000),
  ])

  const hilos = hilosDeEquipo(
    (perfiles ?? []) as { id: string; alias: string; role: string | null; city: string | null }[],
    (mensajes ?? []) as { usuario_id: string; del_equipo: boolean; contenido: string; creado_en: string }[],
  )
  const esperando = hilos.filter((h) => h.esperando).length

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Admin
        </Link>

        <div>
          <h1 className="hidden text-2xl font-bold sm:block">Chats admin</h1>
          <p className="text-sm text-muted-foreground sm:mt-1">
            Escribes como «{NOMBRE_EQUIPO}». {esperando > 0 ? `${esperando} esperando respuesta.` : 'Nadie espera respuesta.'} Pulsa a una persona para
            escribirle, hayan escrito antes o no.
          </p>
        </div>

        <ul className="space-y-2">
          {hilos.map((h) => (
            <li key={h.id}>
              <Link
                href={`/admin/mensajes/${h.id}`}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">
                      {h.alias}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {h.rol === 'volunteer' ? '💛 Acompaña' : h.rol === 'seeker' ? '🤝 Busca apoyo' : ''}
                        {h.ciudad ? ` · ${h.ciudad}` : ''}
                      </span>
                    </p>
                    {h.esperando && (
                      <span className="shrink-0 rounded-full bg-destructive px-2 py-0.5 text-xs text-white">
                        Responder
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {h.ultimo ? `${h.ultimo.del_equipo ? 'Tú: ' : ''}${h.ultimo.contenido}` : 'Sin conversación todavía'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
