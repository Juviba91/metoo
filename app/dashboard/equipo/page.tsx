import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { contarSolicitudesPendientes } from '@/app/safety/actions'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { SiteFooter } from '@/components/site-footer'
import { NOMBRE_EQUIPO } from '@/lib/equipo'
import { FormularioEquipo } from './formulario'
import { enviarAlEquipo } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: NOMBRE_EQUIPO }

/**
 * La conversación de una persona con el equipo de metoo. Una sola, siempre la
 * misma. La escribe Juan desde el panel de admin.
 */
export default async function EquipoPage() {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const { data: mensajes } = await supabase
    .from('mensajes_equipo')
    .select('id, del_equipo, contenido, creado_en')
    .eq('usuario_id', user.id)
    .order('creado_en', { ascending: true })
    .limit(500)

  // Lo que se enseña aquí ya está leído. Se marca antes de contar lo pendiente,
  // para que el globo de la barra inferior ya no lo cuente.
  await supabase.rpc('marcar_equipo_leido')

  const [pendingCount, { data: unreadData }] = await Promise.all([
    contarSolicitudesPendientes(),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
  ])

  const lista = (mensajes ?? []) as { id: number; del_equipo: boolean; contenido: string; creado_en: string }[]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-5 px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8">
        <Link
          href="/dashboard/chats"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Chats
        </Link>

        <div>
          <h1 className="text-lg font-semibold">{NOMBRE_EQUIPO}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Aquí te escribe una persona del equipo de metoo. No somos profesionales de la salud: si
            es urgente, llama al <strong className="text-foreground">024</strong> o al{' '}
            <strong className="text-foreground">112</strong>.
          </p>
        </div>

        <div className="space-y-3">
          {lista.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Todavía no hay mensajes. Si tienes cualquier duda o idea, escríbenos.
            </p>
          ) : (
            lista.map((m) => (
              <div key={m.id} className={`flex ${m.del_equipo ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.del_equipo
                      ? 'border border-border bg-muted/40'
                      : 'bg-foreground text-background'
                  }`}
                >
                  {m.del_equipo && (
                    <p className="mb-0.5 text-xs font-semibold text-muted-foreground">{NOMBRE_EQUIPO}</p>
                  )}
                  <p className="whitespace-pre-line break-words">{m.contenido}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <FormularioEquipo enviar={enviarAlEquipo} />
      </main>

      <SiteFooter className="hidden sm:block" />
      <BottomNav pendingCount={pendingCount} chatUnread={(unreadData as number) ?? 0} />
    </div>
  )
}
