'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkRateLimit, getHiddenUserIds } from '@/app/safety/actions'
import { toSlug } from '@/lib/slug'

export async function createPost(content: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const matches = trimmed.match(/#([a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9_-]+)/g) ?? []
  for (const match of matches) {
    const label = match.slice(1)
    const slug = toSlug(label)
    if (!slug) continue

    const { data: hashtag, error: hashtagError } = await supabase
      .from('hashtags')
      .upsert({ slug, label }, { onConflict: 'slug', ignoreDuplicates: true })
      .select('id')
      .single()

    if (hashtagError || !hashtag) continue

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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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
