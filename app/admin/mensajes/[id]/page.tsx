import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ChatEquipo } from '@/components/chat-equipo'
import { SiteHeader } from '@/components/site-header'
import { responderComoEquipo } from '../actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Conversación' }

const ADMIN_EMAIL = 'baygual91@gmail.com'

/**
 * Tu chat con una persona, a pantalla completa y con el mismo aspecto que un
 * chat normal. Arriba, quién es y en qué temas está (desplegable).
 */
export default async function ConversacionEquipoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  const { id } = await params
  const admin = createAdminClient()

  const { data: perfil } = await admin
    .from('profiles')
    .select('id, alias, role, city, bio, deleted_at')
    .eq('id', id)
    .maybeSingle()
  if (!perfil || perfil.deleted_at) notFound()

  const [{ data: mensajes }, { data: temas }] = await Promise.all([
    admin
      .from('mensajes_equipo')
      .select('id, del_equipo, contenido, creado_en')
      .eq('usuario_id', id)
      .order('creado_en', { ascending: true })
      .limit(500),
    admin.from('profile_hashtags').select('role, hashtags(label)').eq('profile_id', id),
  ])

  // Lo de la persona queda leído por ti al abrir la conversación.
  await admin
    .from('mensajes_equipo')
    .update({ leido_en: new Date().toISOString() })
    .eq('usuario_id', id)
    .eq('del_equipo', false)
    .is('leido_en', null)

  const acompana = ((temas ?? []) as any[]).filter((t) => t.role === 'volunteer' && t.hashtags).map((t) => t.hashtags.label)
  const busca = ((temas ?? []) as any[]).filter((t) => t.role === 'seeker' && t.hashtags).map((t) => t.hashtags.label)

  return (
    <div className="flex h-dvh flex-col bg-background">
      <SiteHeader />

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col md:border-x md:border-border/60">
        <header className="shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Link
              href="/admin/mensajes"
              aria-label="Volver a los mensajes"
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold leading-tight">{perfil.alias}</p>
              <p className="text-xs text-muted-foreground">
                {perfil.role === 'volunteer' ? '💛 Acompaña' : '🤝 Busca apoyo'}
                {perfil.city ? ` · ${perfil.city}` : ''}
              </p>
            </div>
          </div>
          {(acompana.length > 0 || busca.length > 0 || perfil.bio) && (
            <details className="border-t border-border/40 px-4 py-2 text-sm">
              <summary className="cursor-pointer text-xs text-muted-foreground">Ver su perfil</summary>
              <div className="space-y-1 pb-1 pt-2">
                {acompana.length > 0 && <p>💛 Acompaña en: {acompana.join(', ')}</p>}
                {busca.length > 0 && <p>🤝 Busca apoyo en: {busca.join(', ')}</p>}
                {perfil.bio && <p className="text-muted-foreground">{perfil.bio}</p>}
              </div>
            </details>
          )}
        </header>

        <ChatEquipo
          mensajes={(mensajes ?? []) as { id: number; del_equipo: boolean; contenido: string; creado_en: string }[]}
          soyEquipo={true}
          enviar={async (contenido) => {
            'use server'
            return responderComoEquipo(id, contenido)
          }}
          placeholder={`Escribe a ${perfil.alias}...`}
          vacio="Todavía no habéis hablado. Escribe tú el primer mensaje."
        />
      </div>
    </div>
  )
}
