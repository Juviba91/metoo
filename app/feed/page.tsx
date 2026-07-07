import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PostComposer } from './post-composer'
import { PostList } from './post-list'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

export default async function FeedPage() {
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

  const { data } = await supabase
    .from('posts')
    .select(
      `id, content, created_at,
       author:author_id(alias),
       post_hashtags(hashtag:hashtag_id(id, slug, label)),
       post_reactions(profile_id)`,
    )
    .order('created_at', { ascending: false })
    .limit(50)

  const posts = (data ?? []) as any[]

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

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-24 sm:space-y-6 sm:px-6 sm:py-6 sm:pb-6">
        <PostComposer alias={profile.alias} />
        <PostList posts={posts} currentUserId={user.id} />
      </main>

      <BottomNav />
    </div>
  )
}
