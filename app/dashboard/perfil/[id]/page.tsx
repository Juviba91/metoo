import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ContactButton } from '@/components/contact-button'
import { SiteHeader } from '@/components/site-header'
import { BottomNav } from '@/components/bottom-nav'
import { FooterDisclaimer } from '@/components/footer-disclaimer'
import { SiteFooter } from '@/components/site-footer'

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (id === user.id) redirect('/dashboard/perfil')

  const [{ data: viewer }, { data: profile }] = await Promise.all([
    supabase.from('metoo_profiles').select('id, role').eq('id', user.id).single(),
    supabase
      .from('metoo_profiles')
      .select(
        'id, alias, city, bio, role, is_active, metoo_profile_categories(category_id, metoo_categories(slug, name, emoji)), metoo_profile_hashtags(hashtag_id, metoo_hashtags(id, slug, label))',
      )
      .eq('id', id)
      .single(),
  ])

  if (!viewer) redirect('/onboarding')
  if (!profile) notFound()
  if (profile.role === viewer.role) notFound()

  const [connectionResult, { data: unreadData }, pendingResult] = await Promise.all([
    viewer.role === 'seeker'
      ? supabase
          .from('metoo_connections')
          .select('id, status')
          .eq('seeker_id', user.id)
          .eq('volunteer_id', id)
          .maybeSingle()
      : supabase
          .from('metoo_connections')
          .select('id, status')
          .eq('volunteer_id', user.id)
          .eq('seeker_id', id)
          .maybeSingle(),
    supabase.rpc('get_unread_count', { user_uuid: user.id }),
    viewer.role === 'volunteer'
      ? supabase
          .from('metoo_connections')
          .select('id', { count: 'exact', head: true })
          .eq('volunteer_id', user.id)
          .eq('status', 'pending')
      : Promise.resolve({ count: 0 }),
  ])

  const existingConn = connectionResult.data
  const alreadySent = !!existingConn && existingConn.status !== 'rejected'

  const category = (profile.profile_categories as any[])?.[0]?.categories
  const hashtags = (profile.profile_hashtags as any[])
    ?.map((ph: any) => ph.hashtags)
    .filter(Boolean) ?? []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver
        </Link>

        <div className="rounded-xl border border-border p-5 sm:p-6">
          <div className="mb-4">
            <p className="mb-1 text-sm text-muted-foreground">
              {profile.role === 'volunteer' ? '💛 Ofreciendo ayuda' : '🤝 Buscando apoyo'}
            </p>
            <h1 className="text-2xl font-bold">{profile.alias}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" /> {profile.city}
                </span>
              )}
              {category && (
                <span>
                  {category.emoji} {category.name}
                </span>
              )}
            </div>
          </div>

          {hashtags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {hashtags.map((tag: any) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  #{tag.label}
                </span>
              ))}
            </div>
          )}

          {profile.bio && (
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          )}

          {viewer.role === 'seeker' ? (
            profile.is_active ? (
              <ContactButton volunteerId={id} alreadySent={alreadySent} />
            ) : (
              <div className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm text-muted-foreground">
                No disponible en este momento
              </div>
            )
          ) : existingConn && existingConn.status !== 'rejected' ? (
            <Link
              href={`/dashboard/chat/${existingConn.id}`}
              className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Ver conversación →
            </Link>
          ) : (
            <div className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm text-muted-foreground">
              Esperando contacto
            </div>
          )}
        </div>

        <FooterDisclaimer />
      </main>

      <SiteFooter className="hidden sm:block" />
      <BottomNav
        pendingCount={(pendingResult as any).count ?? 0}
        chatUnread={(unreadData as number) ?? 0}
      />
    </div>
  )
}
