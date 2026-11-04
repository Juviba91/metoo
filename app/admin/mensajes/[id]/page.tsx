import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getUser } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FormularioEquipo } from '@/app/dashboard/equipo/formulario'
import { responderComoEquipo } from '../actions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Conversación' }

const ADMIN_EMAIL = 'baygual91@gmail.com'

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

  const lista = (mensajes ?? []) as { id: number; del_equipo: boolean; contenido: string; creado_en: string }[]
  const acompana = ((temas ?? []) as any[]).filter((t) => t.role === 'volunteer' && t.hashtags).map((t) => t.hashtags.label)
  const busca = ((temas ?? []) as any[]).filter((t) => t.role === 'seeker' && t.hashtags).map((t) => t.hashtags.label)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin/mensajes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Mensajes del equipo
      </Link>

      <div className="rounded-xl border border-border p-4">
        <p className="text-lg font-semibold">{perfil.alias}</p>
        <p className="text-xs text-muted-foreground">
          {perfil.role === 'volunteer' ? '💛 Acompaña' : '🤝 Busca apoyo'}
          {perfil.city ? ` · ${perfil.city}` : ''}
        </p>
        {acompana.length > 0 && <p className="mt-2 text-sm">💛 Acompaña en: {acompana.join(', ')}</p>}
        {busca.length > 0 && <p className="mt-1 text-sm">🤝 Busca apoyo en: {busca.join(', ')}</p>}
        {perfil.bio && <p className="mt-2 text-sm text-muted-foreground">{perfil.bio}</p>}
      </div>

      <div className="space-y-3">
        {lista.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Todavía no habéis hablado. Escribe tú el primer mensaje.
          </p>
        ) : (
          lista.map((m) => (
            <div key={m.id} className={`flex ${m.del_equipo ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.del_equipo ? 'bg-foreground text-background' : 'border border-border bg-muted/40'
                }`}
              >
                <p className="whitespace-pre-line break-words">{m.contenido}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <FormularioEquipo
        enviar={async (contenido) => {
          'use server'
          return responderComoEquipo(id, contenido)
        }}
        placeholder={`Escribe a ${perfil.alias}…`}
      />
    </div>
  )
}
