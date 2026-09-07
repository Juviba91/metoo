'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkRateLimit, getHiddenUserIds } from '@/app/safety/actions'
import { toSlug, toLabel } from '@/lib/slug'

/** Cuántas etiquetas distintas se dan de alta como mucho por publicación. */
const MAX_HASHTAGS_POR_POST = 5
/** Longitud máxima de una etiqueta, en caracteres. */
const MAX_LONGITUD_HASHTAG = 40

export async function createPost(content: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 500) return { error: 'Contenido inválido' }

  const { allowed } = await checkRateLimit('post_create')
  if (!allowed) return { error: 'Has alcanzado el límite de publicaciones. Intenta más tarde.' }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({ author_id: user.id, content: trimmed })
    .select('id')
    .single()

  if (error || !post) return { error: 'Error al publicar' }

  // El catálogo de `hashtags` es común: lo que se cree aquí se le ofrece como
  // sugerencia a todo el mundo al editar su perfil. Sin tope, un solo post de
  // 500 caracteres podía dar de alta más de cien etiquetas, y el límite de 20
  // posts por hora deja margen de sobra para ensuciárselo a los demás.
  const matches = trimmed.match(/#([a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9_-]+)/g) ?? []
  const slugsVistos = new Set<string>()

  for (const match of matches) {
    // `#Gemelos_prematuros` se guarda como "Gemelos prematuros": en un post el
    // guion bajo es la única forma de unir dos palabras, pero eso es cómo se
    // escribe, no cómo se lee.
    const label = toLabel(match.slice(1))
    // Una etiqueta larguísima no la busca nadie y afea las sugerencias.
    if (label.length > MAX_LONGITUD_HASHTAG) continue

    const slug = toSlug(label)
    if (!slug || slugsVistos.has(slug)) continue
    if (slugsVistos.size >= MAX_HASHTAGS_POR_POST) break
    slugsVistos.add(slug)

    // `ignoreDuplicates` se traduce a ON CONFLICT DO NOTHING, y esa forma no
    // devuelve la fila en conflicto: para un hashtag que YA existe (los de la
    // lista curada, o cualquiera ya usado antes) el upsert no devuelve nada.
    // Sin el fallback el post quedaba sin enlazar y no aparecía al filtrar.
    let { data: hashtag } = await supabase
      .from('hashtags')
      .upsert({ slug, label }, { onConflict: 'slug', ignoreDuplicates: true })
      .select('id')
      .maybeSingle()

    if (!hashtag) {
      const { data: existing } = await supabase
        .from('hashtags')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      hashtag = existing
    }

    if (!hashtag) continue

    const { error: phError } = await supabase
      .from('post_hashtags')
      .upsert(
        { post_id: post.id, hashtag_id: hashtag.id },
        { onConflict: 'post_id,hashtag_id', ignoreDuplicates: true },
      )

    if (phError) {
      console.error('Error creating post_hashtag:', phError)
    }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function fetchMorePosts(offset: number, tag: string | null = null) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { posts: [] as any[] }

  const postsSelect = `id, content, created_at, author:author_id(alias), post_hashtags(hashtag:hashtag_id(id, slug, label)), post_reactions(profile_id)`
  let q = supabase.from('posts').select(postsSelect).order('created_at', { ascending: false }).range(offset, offset + 19)

  // Mismo filtro de bloqueos que en la carga inicial del feed
  const hiddenIds = await getHiddenUserIds()
  if (hiddenIds.length > 0) q = q.not('author_id', 'in', `(${hiddenIds.join(',')})`)

  if (tag) {
    const { data: hashtag } = await supabase.from('hashtags').select('id').eq('slug', tag).maybeSingle()
    if (hashtag) {
      const { data: phs } = await supabase.from('post_hashtags').select('post_id').eq('hashtag_id', hashtag.id)
      if (phs?.length) q = q.in('id', phs.map((ph: any) => ph.post_id))
      else return { posts: [] as any[] }
    } else {
      return { posts: [] as any[] }
    }
  }

  const { data } = await q
  return { posts: (data ?? []) as any[] }
}

export async function toggleReaction(postId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: existing } = await supabase
    .from('post_reactions')
    .select('post_id')
    .eq('post_id', postId)
    .eq('profile_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error: deleteError } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('profile_id', user.id)

    if (deleteError) {
      console.error('Error removing reaction:', deleteError)
      return { error: 'Error al remover reacción' }
    }
  } else {
    const { error: insertError } = await supabase
      .from('post_reactions')
      .insert({ post_id: postId, profile_id: user.id })

    if (insertError) {
      console.error('Error adding reaction:', insertError)
      return { error: 'Error al agregar reacción' }
    }
  }

  revalidatePath('/feed')
  return { success: true }
}
