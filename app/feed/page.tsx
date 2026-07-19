import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostComposer } from './post-composer'
import { PostList } from './post-list'
import { BottomNav } from '@/components/bottom-nav'
import { SiteHeader } from '@/components/site-header'
import Link from 'next/link'
import { X } from 'lucide-react'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, alias, role')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/onboarding')

  const { tag: activeTag } = await searchParams

  const [{ data }, { count: pendingCount }] = await Promise.all([
    supabase
    .from('posts')
    .select(
      `id, content, created_at,
       author:author_id(alias),
       post_hashtags(hashtag:hashtag_id(id, slug, label)),
       post_reactions(profile_id)`,
    )
      .order('created_at', { ascending: false })
      .limit(50),
    profile.role === 'volunteer'
      ? supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('volunteer_id', user.id)
          .eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
  ])

  const allPosts = (data ?? []) as any[]
  const posts = activeTag
    ? allPosts.filter((p) =>
        (p.post_hashtags as any[]).some((ph) => ph.hashtag?.slug === activeTag),
      )
    : allPosts

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-24 sm:space-y-6 sm:px-6 sm:py-6 sm:pb-6">
        <div>
          <h1 className="text-lg font-semibold">Feed de la comunidad</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Comparte tu experiencia, un pensamiento o un recurso que te haya ayudado. Usa <strong className="text-foreground">#hashtags</strong> para que otros puedan encontrarte.
          </p>
        </div>

        {activeTag && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrando por</span>
            <Link
              href="/feed"
              className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              #{activeTag}
              <X className="size-3" />
            </Link>
          </div>
        )}

        <PostComposer alias={profile.alias} />
        <PostList posts={posts} currentUserId={user.id} activeTag={activeTag ?? null} />
      </main>

      <BottomNav pendingCount={pendingCount ?? 0} />
    </div>
  )
}
