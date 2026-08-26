import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resendConfirmation } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Verifica tu correo' }

export default async function VerificarPage() {
  const user = await getUser()

  if (!user) redirect('/auth/login')
  if (user.email_confirmed_at) redirect('/dashboard')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Link href="/" className="mb-10">
        <Logo showWordmark={false} size={56} />
      </Link>

      <div className="mb-6 text-5xl">✉️</div>
      <h1 className="mb-2 text-2xl font-bold">Confirma tu correo</h1>
      <p className="mb-1 max-w-sm text-muted-foreground">
        Te hemos enviado un enlace de confirmación a{' '}
        <strong className="text-foreground">{user.email}</strong>.
      </p>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Revisa también la carpeta de spam. Al hacer clic en el enlace entrarás
        directamente a la app.
      </p>

      <form
        action={async () => {
          'use server'
          await resendConfirmation()
        }}
      >
        <Button type="submit" variant="outline">
          Reenviar correo de confirmación
        </Button>
      </form>

      <Link
        href="/auth/login"
        className="mt-6 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Usar otro correo
      </Link>
    </div>
  )
}
