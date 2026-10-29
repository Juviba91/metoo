'use client'

import Link from 'next/link'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, signUp, requestPasswordReset, enviarEnlace, verificarCodigo } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { SiteFooter } from '@/components/site-footer'
import { Logo } from '@/components/logo'
import { destinoSeguro } from '@/lib/destino'

type Mode = 'enlace' | 'codigo' | 'login' | 'register' | 'forgot'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  // Por defecto, sin contraseña: un enlace por correo vale para entrar y para
  // crear la cuenta. Quien prefiera contraseña tiene las pestañas de siempre.
  const [mode, setMode] = useState<Mode>(
    params.get('tab') === 'register' ? 'register' : params.get('tab') === 'login' ? 'login' : 'enlace',
  )
  const [codigo, setCodigo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    params.get('error') === 'enlace' || params.get('error') === 'auth'
      ? 'El enlace no ha funcionado o ha caducado. Pide otro, o escribe el código del correo.'
      : null,
  )
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    if (mode === 'enlace') {
      const result = await enviarEnlace(email, params.get('next'))
      setLoading(false)
      if (result.error) {
        setError(result.error)
        return
      }
      setMode('codigo')
      return
    }

    if (mode === 'codigo') {
      const result = await verificarCodigo(email, codigo)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      router.push(destinoSeguro(params.get('next')))
      router.refresh()
      return
    }

    if (mode === 'forgot') {
      const result = await requestPasswordReset(email)
      if (result.error) {
        setError(result.error)
      } else {
        setInfo('Te hemos enviado un enlace a tu correo. Revisa también el buzón de spam.')
      }
      setLoading(false)
      return
    }

    const result = mode === 'login' ? await signIn(email, password) : await signUp(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if ('needsVerification' in result && result.needsVerification) {
      router.push('/auth/verificar')
      return
    }

    // Tras crear la cuenta toca el registro, no el enlace; al entrar, sí se
    // vuelve a donde ibas (p. ej. el enlace de un correo).
    router.push(mode === 'login' ? destinoSeguro(params.get('next')) : '/dashboard')
    router.refresh()
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="mb-10 flex justify-center">
        <Logo showWordmark={false} size={56} />
      </Link>

      {mode === 'enlace' || mode === 'codigo' ? (
        <>
          <h1 className="mb-2 text-center text-xl font-semibold">
            {mode === 'enlace' ? 'Entra o crea tu cuenta' : 'Mira tu correo'}
          </h1>
          <p className="mb-8 text-center text-sm leading-relaxed text-muted-foreground">
            {mode === 'enlace' ? (
              'Sin contraseña: te mandamos un enlace a tu correo. Si aún no tienes cuenta, se crea al entrar.'
            ) : (
              <>
                Te hemos escrito a <strong className="text-foreground">{email}</strong>. Pulsa el
                enlace del correo o escribe aquí el código. Si no lo ves, mira en spam.
              </>
            )}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'enlace' ? (
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="codigo" className="mb-1.5 block text-sm font-medium">Código del correo</label>
                <input
                  id="codigo"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={10}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.4em] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : mode === 'enlace' ? 'Envíame el enlace' : 'Entrar con el código'}
            </Button>
          </form>

          <div className="mt-5 space-y-2 text-center text-sm">
            {mode === 'codigo' && (
              <button
                type="button"
                onClick={() => switchMode('enlace')}
                className="block w-full text-muted-foreground hover:text-foreground"
              >
                ← Usar otro correo o pedir uno nuevo
              </button>
            )}
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="block w-full text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Prefiero usar contraseña
            </button>
          </div>
        </>
      ) : mode !== 'forgot' ? (
        <>
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-11 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="mt-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-green-600">{info}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => switchMode('enlace')}
            className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Entrar sin contraseña, con un enlace al correo
          </button>
        </>
      ) : (
        <>
          <h1 className="mb-2 text-center text-xl font-semibold">Recuperar contraseña</h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Te enviamos un enlace a tu correo para restablecer la contraseña.
          </p>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            {info && <p className="text-sm text-green-600">{info}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '...' : 'Enviar enlace'}
            </Button>
          </form>
          <button
            onClick={() => switchMode('login')}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver al inicio de sesión
          </button>
        </>
      )}

      <p className="mt-10 text-center text-xs text-muted-foreground">
        metoo no sustituye a un profesional de salud mental.
        <br />
        Si lo necesitas, el <strong>024</strong> te escucha.
        <br />
        <a href="/guidelines" className="mt-1 inline-block underline hover:text-foreground">
          Normas de la comunidad
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <SiteFooter />
    </div>
  )
}
