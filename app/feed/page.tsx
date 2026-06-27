import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostComposer } from './post-composer'
import { PostList } from './post-list'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function FeedPage(props: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await props.searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, alias')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/onboarding')

  const { data: hashtags } = await supabase
    .from('hashtags')
    .select('id, slug, label')
    .order('label')
    .limit(40)

  // Resolve filtered post IDs when a tag is active
  let filteredPostIds: string[] | null = null
  if (tag) {
    const { data: tagRow } = await supabase
      .from('hashtags')
      .select('id')
      .eq('slug', tag)
      .single()

    if (tagRow) {
      const { data: ph } = await supabase
        .from('post_hashtags')
        .select('post_id')
        .eq('hashtag_id', tagRow.id)
      filteredPostIds = (ph ?? []).map((r) => r.post_id)
    } else {
      filteredPostIds = []
    }
  }

  let posts: any[] = []
  if (filteredPostIds === null || filteredPostIds.length > 0) {
    let q = supabase
      .from('posts')
      .select(
        `id, content, created_at,
         author:author_id(alias),
         post_hashtags(hashtag:hashtag_id(id, slug, label)),
         post_reactions(profile_id)`,
      )
      .order('created_at', { ascending: false })
      .limit(50)

    if (filteredPostIds && filteredPostIds.length > 0) {
      q = q.in('id', filteredPostIds)
    }

    const { data } = await q
    posts = data ?? []
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-4">
          <Link
            href="/dashboard"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="font-semibold">Feed</span>
          <span className="ml-auto text-xl font-bold tracking-tight">metoo.</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-6 py-6">
        {/* Hashtag filter bar */}
        {hashtags && hashtags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href="/feed"
              className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
                !tag
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              Todos
            </Link>
            {hashtags.map((h) => (
              <Link
                key={h.id}
                href={`/feed?tag=${encodeURIComponent(h.slug)}`}
                className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
                  tag === h.slug
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                #{h.label}
              </Link>
            ))}
          </div>
        )}

        <PostComposer alias={profile.alias} />

        <PostList posts={posts} currentUserId={user.id} />
      </main>
    </div>
  )
}
