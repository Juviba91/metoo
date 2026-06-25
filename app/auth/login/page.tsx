'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="mb-10 block text-center text-2xl font-bold tracking-tight">
          metoo.
        </a>

        {sent ? (
          <div className="text-center">
            <div className="mb-4 text-5xl">✉️</div>
            <h1 className="mb-2 text-xl font-semibold">Revisa tu email</h1>
            <p className="text-muted-foreground">
              Enviamos un enlace mágico a <strong>{email}</strong>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Puedes cerrar esta pestaña.
            </p>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-center text-2xl font-bold">Bienvenido</h1>
            <p className="mb-8 text-center text-muted-foreground">
              Introduce tu email para entrar o crear tu cuenta
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Continuar con email'}
              </Button>
            </form>
          </>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          metoo no sustituye a un profesional de salud mental.
          <br />
          En emergencias llama al <strong>024</strong>.
        </p>
      </div>
    </div>
  )
}
