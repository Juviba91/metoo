'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart } from 'lucide-react'
import { HashtagPicker, type HashtagOption } from '@/components/hashtag-picker'
import { completeOnboarding } from './actions'
import Link from 'next/link'

export function OnboardingWizard({ suggestions }: { suggestions: HashtagOption[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [accepted, setAccepted] = useState(false)
  const [role, setRole] = useState<'seeker' | 'volunteer' | null>(null)
  const [roleConfirmed, setRoleConfirmed] = useState(false)
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

    setStep(5)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 3000)
  }

  const totalSteps = 4
  const stepLabels = ['Normas', 'Tu rol', 'Hashtags', 'Perfil']

  return (
    <div className="w-full max-w-lg">
      <a href="/" className="mb-8 block text-center text-2xl font-bold tracking-tight">
        metoo.
      </a>

      {step <= totalSteps && (
        <div className="mb-10">
          <div className="mb-2 flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1.5 w-10 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Paso {step} de {totalSteps} — {stepLabels[step - 1]}
          </p>
        </div>
      )}

      {/* Paso 1 — Normas */}
      {step === 1 && (
        <div>
          <h1 className="mb-2 text-center text-2xl font-bold">Antes de empezar</h1>
          <p className="mb-6 text-center text-muted-foreground">
            Lee y acepta las normas de la comunidad
          </p>

          <div className="mb-6 space-y-4 rounded-xl border border-border bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
            <div>
              <p className="mb-1 font-semibold text-foreground">Personas reales, no profesionales</p>
              <p>
                Los voluntarios comparten su experiencia vivida, no son psicólogos ni terapeutas.
                Si lo necesitas, el{' '}
                <strong className="text-foreground">024</strong> te escucha.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-foreground">Tu privacidad, primero</p>
              <p>
                Usa un nombre de usuario y comparte solo lo que quieras. Evita datos personales
                en el chat como tu nombre real, teléfono o dirección.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-foreground">Un espacio de respeto</p>
              <p>
                Aquí todos pasamos por algo difícil. Trato amable siempre, sin presiones ni
                fines comerciales.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-foreground">Si eres voluntario</p>
              <p>
                Habla desde lo que viviste, sin diagnósticos. Tu participación es libre —
                cuídate también a ti.
              </p>
            </div>
          </div>

          <label className="mb-6 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-foreground"
            />
            <span className="text-sm text-muted-foreground">
              He leído y acepto las{' '}
              <Link
                href="/guidelines"
                target="_blank"
                className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
              >
                normas de la comunidad
              </Link>
            </span>
          </label>

          <Button onClick={() => setStep(2)} disabled={!accepted} className="w-full gap-2">
            Continuar <ArrowRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Paso 2 — Rol */}
      {step === 2 && !roleConfirmed && (
        <div>
          <h1 className="mb-2 text-center text-2xl font-bold">¿Cómo puedo ayudarte?</h1>
          <p className="mb-8 text-center text-muted-foreground">Cuéntame qué te trae aquí</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => {
                setRole('seeker')
                setStep(3)
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
              onClick={() => setRole('volunteer')}
              className={`rounded-xl border-2 p-6 text-left transition-all hover:border-primary hover:bg-muted/30 ${role === 'volunteer' ? 'border-primary bg-muted/30' : 'border-border'}`}
            >
              <div className="mb-3 text-3xl">💛</div>
              <h3 className="mb-1 font-semibold">Quiero ayudar</h3>
              <p className="text-sm text-muted-foreground">
                He pasado por algo difícil y quiero acompañar a otros
              </p>
            </button>
          </div>
          {role === 'volunteer' && (
            <Button onClick={() => setRoleConfirmed(true)} className="mt-4 w-full gap-2">
              Continuar <ArrowRight className="size-4" />
            </Button>
          )}
          <Button variant="outline" onClick={() => setStep(1)} className="mt-3 w-full">
            Atrás
          </Button>
        </div>
      )}

      {/* Paso 2b — Rol voluntario: qué se espera */}
      {step === 2 && roleConfirmed && role === 'volunteer' && (
        <div>
          <h1 className="mb-2 text-center text-2xl font-bold">Tu rol como voluntario</h1>
          <p className="mb-6 text-center text-muted-foreground">
            Antes de continuar, es importante que esto quede claro
          </p>
          <div className="mb-6 space-y-4 rounded-xl border border-border bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground">
            <div>
              <p className="mb-1 font-semibold text-foreground">Hablas desde tu experiencia</p>
              <p>
                Compartes cómo lo viviste tú — qué te ayudó, qué fue difícil, qué harías
                diferente. Das recomendaciones prácticas si las tienes. Sin teorías, sin manuales.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-foreground">No quitas hierro</p>
              <p>
                Aunque a ti ya no te pese, el dolor de la otra persona es real en su momento.
                Escucha sin minimizar ni comparar sufrimientos.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-foreground">No eres psicólogo</p>
              <p>
                No das diagnósticos ni actúas como terapeuta. Si sientes que alguien necesita ayuda
                profesional, se lo dices con cariño y le mencionas que el{' '}
                <strong className="text-foreground">024</strong> está disponible.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold text-foreground">Cuídate también a ti</p>
              <p>
                Acompañar puede remover cosas. Si en algún momento sientes que no puedes más, está
                bien parar. Tu bienestar importa.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRoleConfirmed(false)} className="flex-1">
              Atrás
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1 gap-2">
              Lo entiendo, continuar <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Paso 3 — Hashtags */}
      {step === 3 && (
        <div>
          <h1 className="mb-2 text-center text-2xl font-bold">
            {role === 'seeker' ? '¿Qué estás viviendo?' : '¿En qué puedes acompañar?'}
          </h1>
          <p className="mb-6 text-center text-muted-foreground">
            Elige hashtags o crea los tuyos — el hospital también puede ser uno
          </p>
          <HashtagPicker suggestions={suggestions} selected={hashtags} onChange={setHashtags} />
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1"
            >
              Atrás
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={hashtags.length === 0}
              className="flex-1 gap-2"
            >
              Continuar <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Paso 5 — Bienvenida */}
      {step === 5 && (
        <div className="py-8 text-center">
          <div className="mb-6 text-5xl">💛</div>
          <h1 className="mb-3 text-2xl font-bold">
            Bienvenido{role === 'volunteer' ? ' al equipo' : ''}, {alias}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {role === 'volunteer'
              ? 'Gracias por querer acompañar. Recibirás solicitudes de personas que han vivido lo que tú has vivido.'
              : 'Ya estás dentro. Vamos a conectarte con alguien que ha pasado por lo mismo.'}
          </p>
          <p className="text-xs text-muted-foreground">Entrando a metoo...</p>
        </div>
      )}

      {/* Paso 4 — Perfil */}
      {step === 4 && (
        <div>
          <h1 className="mb-2 text-center text-2xl font-bold">Tu perfil</h1>
          <p className="mb-8 text-center text-muted-foreground">
            Elige un nombre de usuario anónimo y dinos dónde estás
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nombre de usuario</label>
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
            <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
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
