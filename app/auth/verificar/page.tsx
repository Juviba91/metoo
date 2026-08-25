import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { resendConfirmation } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'

export default async function VerificarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')
  if (user.email_confirmed_at) redirect('/dashboard')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <a href="/" className="mb-10 text-2xl font-bold tracking-tight">
        metoo.
      </a>

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

      <a
        href="/auth/login"
        className="mt-6 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Usar otro correo
      </a>
    </div>
  )
}
