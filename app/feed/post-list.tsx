'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { toggleReaction } from './actions'

type Hashtag = { id: string; slug: string; label: string }

type Post = {
  id: string
  content: string
  created_at: string
  author: { alias: string } | null
  post_hashtags: { hashtag: Hashtag | null }[]
  post_reactions: { profile_id: string }[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

function renderContent(content: string) {
  const parts = content.split(/(#[a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9_-]+)/g)
  return parts.map((part, i) =>
    part.startsWith('#') ? (
      <Link
        key={i}
        href={`/feed?tag=${encodeURIComponent(part.slice(1).toLowerCase())}`}
        className="font-medium text-primary hover:underline"
      >
        {part}
      </Link>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function PostList({
  posts,
  currentUserId,
  activeTag,
}: {
  posts: Post[]
  currentUserId: string
  activeTag: string | null
}) {
  const [reactions, setReactions] = useState<Record<string, { count: number; mine: boolean }>>(() => {
    const state: Record<string, { count: number; mine: boolean }> = {}
    for (const post of posts) {
      state[post.id] = {
        count: post.post_reactions.length,
        mine: post.post_reactions.some((r) => r.profile_id === currentUserId),
      }
    }
    return state
  })

  async function handleReaction(postId: string) {
    const current = reactions[postId] ?? { count: 0, mine: false }
    setReactions((prev) => ({
      ...prev,
      [postId]: { count: current.mine ? current.count - 1 : current.count + 1, mine: !current.mine },
    }))
    await toggleReaction(postId)
  }

  if (posts.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {activeTag
          ? `No hay publicaciones con #${activeTag} todavía.`
          : 'Todavía no hay publicaciones. ¡Sé el primero en compartir!'}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const r = reactions[post.id] ?? { count: 0, mine: false }
        const hashtags = post.post_hashtags.map((ph) => ph.hashtag).filter(Boolean) as Hashtag[]

        return (
          <article key={post.id} className="rounded-xl border border-border p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold">
                {post.author?.alias ?? 'Anónimo'}
              </span>
              <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
            </div>

            <p className="text-sm leading-relaxed">{renderContent(post.content)}</p>

            {hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {hashtags.map((h) => (
                  <Link
                    key={h.id}
                    href={`/feed?tag=${encodeURIComponent(h.slug)}`}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    #{h.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => handleReaction(post.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  r.mine
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <Heart className={`size-3.5 ${r.mine ? 'fill-current' : ''}`} />
                Dar ánimo
                {r.count > 0 && <span className="font-semibold">{r.count}</span>}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
