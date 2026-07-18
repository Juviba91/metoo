import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostComposer } from './post-composer'
import { PostList } from './post-list'
import { BottomNav } from '@/components/bottom-nav'
import { SiteHeader } from '@/components/site-header'

export default async function FeedPage() {
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

  const posts = (data ?? []) as any[]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-24 sm:space-y-6 sm:px-6 sm:py-6 sm:pb-6">
        <PostComposer alias={profile.alias} />
        <PostList posts={posts} currentUserId={user.id} />
      </main>

      <BottomNav pendingCount={pendingCount ?? 0} />
    </div>
  )
}
