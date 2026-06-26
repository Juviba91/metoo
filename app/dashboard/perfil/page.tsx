import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditForm } from './edit-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('alias, city, bio, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href="/dashboard"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="font-semibold">Editar perfil</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <EditForm
          initial={{ alias: profile.alias, city: profile.city, bio: profile.bio }}
          role={profile.role}
        />
      </main>
    </div>
  )
}
