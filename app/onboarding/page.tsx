'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart } from 'lucide-react'

const CATEGORIES = [
  { slug: 'ucin', emoji: '🏥', name: 'UCIN', sub: 'Bebé ingresado en cuidados intensivos neonatales' },
  { slug: 'prematuro-extremo', emoji: '👶', name: 'Prematuro extremo', sub: 'Menos de 28 semanas de gestación' },
  { slug: 'prematuro-tardio', emoji: '🌱', name: 'Prematuro tardío', sub: 'Entre 28 y 36 semanas' },
  { slug: 'secuelas', emoji: '🧠', name: 'Secuelas del prematuro', sub: 'Parálisis cerebral, retinopatía, displasia' },
  { slug: 'perdida-neonatal', emoji: '💙', name: 'Pérdida neonatal', sub: 'El dolor más difícil de sobrellevar' },
  { slug: 'gemelos-prematuros', emoji: '👫', name: 'Gemelos prematuros', sub: 'El doble de amor, el doble de miedo' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'seeker' | 'volunteer' | null>(null)
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const [alias, setAlias] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinish() {
    if (!role || !categorySlug || !alias.trim() || !city.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      alias: alias.trim(),
      role,
      city: city.trim(),
      country: 'ES',
    })

    if (profileError) {
      setError(
        profileError.code === '23505'
          ? 'Ese alias ya está en uso, prueba con otro.'
          : 'Error al guardar el perfil. Inténtalo de nuevo.',
      )
      setLoading(false)
      return
    }

    if (cat) {
      await supabase.from('profile_categories').insert({
        profile_id: user.id,
        category_id: cat.id,
      })
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <a href="/" className="mb-8 block text-center text-2xl font-bold tracking-tight">
          metoo.
        </a>

        {/* Progress */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 w-12 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {/* Step 1: Role */}
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

        {/* Step 2: Category */}
        {step === 2 && (
          <div>
            <h1 className="mb-2 text-center text-2xl font-bold">
              {role === 'seeker' ? '¿Qué estás viviendo?' : '¿En qué puedes acompañar?'}
            </h1>
            <p className="mb-6 text-center text-muted-foreground">Elige la experiencia principal</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setCategorySlug(cat.slug)}
                  className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary ${
                    categorySlug === cat.slug
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <span className="mb-1 block text-2xl">{cat.emoji}</span>
                  <h3 className="text-sm font-semibold">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">{cat.sub}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Atrás
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!categorySlug}
                className="flex-1 gap-2"
              >
                Continuar <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Profile */}
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
    </div>
  )
}
