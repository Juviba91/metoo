import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient, getUser } from '@/lib/supabase/server'
import { SiteHeader } from '@/components/site-header'
import { ChatEquipo } from '@/components/chat-equipo'
import { NOMBRE_EQUIPO } from '@/lib/equipo'
import { enviarAlEquipo, marcarEquipoLeido } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: NOMBRE_EQUIPO }

/**
 * La conversación de una persona con el equipo de metoo. Una sola, siempre la
 * misma, a pantalla completa como el resto de chats (sin barra inferior). La
 * escribe Juan desde el panel de admin; el primer mensaje sale solo.
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

  return (
    <div className="flex h-dvh flex-col bg-background">
      <SiteHeader />

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col md:border-x md:border-border/60">
        <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          <Link
            href="/dashboard/chats"
            aria-label="Volver a Chats"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{NOMBRE_EQUIPO}</p>
            <p className="text-xs text-muted-foreground">Te escribe Juan, del Equipo de metoo</p>
          </div>
        </header>

        <ChatEquipo
          mensajes={(mensajes ?? []) as { id: number; del_equipo: boolean; contenido: string; creado_en: string }[]}
          soyEquipo={false}
          enviar={enviarAlEquipo}
          alVer={marcarEquipoLeido}
          vacio="Todavía no hay mensajes. Si tienes cualquier duda o idea, escríbenos."
          nota={
            <>
              Al otro lado hay una persona, no un profesional. Si es urgente:{' '}
              <strong className="font-medium">112</strong>.
            </>
          }
        />
      </div>
    </div>
  )
}
