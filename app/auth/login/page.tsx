'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email o contraseña incorrectos.')
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(
          error.message.includes('already registered')
            ? 'Ya tienes una cuenta con ese email. Entra con tu contraseña.'
            : 'Error al crear la cuenta. Inténtalo de nuevo.',
        )
        setLoading(false)
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="mb-10 block text-center text-2xl font-bold tracking-tight">
          metoo.
        </a>

        {/* Tabs */}
        <div className="mb-8 flex rounded-xl border border-border p-1">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
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
