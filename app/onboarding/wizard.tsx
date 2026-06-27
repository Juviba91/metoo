'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart } from 'lucide-react'
import { HashtagPicker, type HashtagOption } from '@/components/hashtag-picker'
import { completeOnboarding } from './actions'

export function OnboardingWizard({ suggestions }: { suggestions: HashtagOption[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'seeker' | 'volunteer' | null>(null)
  const [hashtags, setHashtags] = useState<HashtagOption[]>([])
  const [alias, setAlias] = useState('')
  const [city, setCity] = useState('')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinish() {
    if (!role || hashtags.length === 0 || !alias.trim() || !city.trim()) return
    setLoading(true)
    setError(null)

    const result = await completeOnboarding({ role, hashtags, alias, city, bio })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-lg">
      <a href="/" className="mb-8 block text-center text-2xl font-bold tracking-tight">
        metoo.
      </a>

      <div className="mb-10 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 w-12 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div>
          <h1 className="mb-2 text-center text-2xl font-bold">¿Cómo puedo ayudarte?</h1>
          <p className="mb-8 text-center text-muted-foreground">Cuéntame qué te trae aquí</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => {
                setRole('seeker')
                setStep(2)
              }}
              className="rounded-xl border-2 border-border p-6 text-left transition-all hover:border-primary hover:bg-muted/30"
            >
              <div className="mb-3 text-3xl">🤝</div>
              <h3 className="mb-1 font-semibold">Busco apoyo</h3>
              <p className="text-sm text-muted-foreground">
                Quiero conectar con alguien que ha vivido lo mismo
              </p>
            </button>
            <button
              onClick={() => {
                setRole('volunteer')
                setStep(2)
              }}
              className="rounded-xl border-2 border-border p-6 text-left transition-all hover:border-primary hover:bg-muted/30"
            >
              <div className="mb-3 text-3xl">💛</div>
              <h3 className="mb-1 font-semibold">Quiero ayudar</h3>
              <p className="text-sm text-muted-foreground">
                He pasado por algo difícil y quiero acompañar a otros
              </p>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="mb-2 text-center text-2xl font-bold">
            {role === 'seeker' ? '¿Qué estás viviendo?' : '¿En qué puedes acompañar?'}
          </h1>
          <p className="mb-6 text-center text-muted-foreground">
            Elige hashtags o crea los tuyos — el hospital también puede ser uno
          </p>
          <HashtagPicker suggestions={suggestions} selected={hashtags} onChange={setHashtags} />
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Atrás
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={hashtags.length === 0}
              className="flex-1 gap-2"
            >
              Continuar <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="mb-2 text-center text-2xl font-bold">Tu perfil</h1>
          <p className="mb-8 text-center text-muted-foreground">
            Elige un alias anónimo y dinos dónde estás
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Alias</label>
              <input
                type="text"
                placeholder="Ej: luna_azul, padre_fuerte..."
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                maxLength={30}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Tu nombre real nunca se mostrará
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ciudad</label>
              <input
                type="text"
                placeholder="Ej: Barcelona, Madrid, Valencia..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {role === 'volunteer' ? 'Tu experiencia (opcional)' : 'Tu situación (opcional)'}
              </label>
              <textarea
                placeholder={
                  role === 'volunteer'
                    ? 'Cuéntanos brevemente qué has vivido y cómo puedes ayudar...'
                    : 'Cuéntanos brevemente qué estás atravesando...'
                }
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {bio.length}/300 — solo la ven las personas con las que conectes
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
              Atrás
            </Button>
            <Button
              onClick={handleFinish}
              disabled={!alias.trim() || !city.trim() || loading}
              className="flex-1 gap-2"
            >
              {loading ? 'Guardando...' : 'Entrar a metoo'}
              {!loading && <Heart className="size-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
