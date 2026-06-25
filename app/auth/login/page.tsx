'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Try login first, if user doesn't exist, sign up
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        // User doesn't exist yet — create account
        const { error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) {
          setError('Error al crear la cuenta. Inténtalo de nuevo.')
          setLoading(false)
          return
        }
      } else {
        setError('Email o contraseña incorrectos.')
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="mb-10 block text-center text-2xl font-bold tracking-tight">
          metoo.
        </a>

        <h1 className="mb-2 text-center text-2xl font-bold">Bienvenido</h1>
        <p className="mb-8 text-center text-muted-foreground">
          Entra o crea tu cuenta — sin verificación de email
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
          <input
            type="password"
            required
            minLength={6}
            placeholder="Contraseña (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar / Crear cuenta'}
          </Button>
        </form>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          metoo no sustituye a un profesional de salud mental.
          <br />
          En emergencias llama al <strong>024</strong>.
        </p>
      </div>
    </div>
  )
}
