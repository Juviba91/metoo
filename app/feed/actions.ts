'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function createPost(content: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const trimmed = content.trim()
  if (!trimmed || trimmed.length > 500) return { error: 'Contenido inválido' }

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

    const { data: hashtag } = await supabase
      .from('hashtags')
      .upsert({ slug, label }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (hashtag) {
      await supabase
        .from('post_hashtags')
        .upsert(
          { post_id: post.id, hashtag_id: hashtag.id },
          { onConflict: 'post_id,hashtag_id', ignoreDuplicates: true },
        )
    }
  }

  revalidatePath('/feed')
  return { success: true }
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
    await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('profile_id', user.id)
  } else {
    await supabase
      .from('post_reactions')
      .insert({ post_id: postId, profile_id: user.id })
  }

  revalidatePath('/feed')
  return { success: true }
}
