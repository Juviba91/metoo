'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateProfile } from '@/app/dashboard/actions'
import { HashtagPicker, HashtagOption } from '@/components/hashtag-picker'
import { Check } from 'lucide-react'

export function EditForm({
  initial,
  role,
  suggestions,
}: {
  initial: { alias: string; city: string | null; bio: string | null; hashtags: HashtagOption[]; isActive: boolean }
  role: 'seeker' | 'volunteer'
  suggestions: HashtagOption[]
}) {
  const [alias, setAlias] = useState(initial.alias)
  const [city, setCity] = useState(initial.city ?? '')
  const [bio, setBio] = useState(initial.bio ?? '')
  const [hashtags, setHashtags] = useState<HashtagOption[]>(initial.hashtags)
  const [isActive, setIsActive] = useState(initial.isActive)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!alias.trim() || !city.trim()) return
    setLoading(true)
    setError(null)
    setSaved(false)

    const result = await updateProfile({ alias, city, bio, hashtags, isActive })

    if (result.error) {
      setError(result.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  const inputClass =
    'w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Alias</label>
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          maxLength={30}
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">Tu nombre real nunca se mostrará</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Ciudad</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {role === 'volunteer' ? 'Tu experiencia' : 'Tu situación'}
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={4}
          placeholder={
            role === 'volunteer'
              ? 'Cuéntanos brevemente qué has vivido y cómo puedes ayudar...'
              : 'Cuéntanos brevemente qué estás atravesando...'
          }
          className={`${inputClass} resize-none`}
        />
        <p className="mt-1 text-xs text-muted-foreground">{bio.length}/300</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Tus hashtags</label>
        <p className="mb-3 text-xs text-muted-foreground">
          Indica tu situación, hospital, diagnóstico...
        </p>
        <HashtagPicker
          suggestions={suggestions}
          selected={hashtags}
          onChange={setHashtags}
        />
      </div>

      {role === 'volunteer' && (
        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <p className="text-sm font-medium">Disponible para recibir solicitudes</p>
            <p className="text-xs text-muted-foreground">
              {isActive ? 'Tu perfil aparece en los resultados' : 'Tu perfil está oculto temporalmente'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
              isActive ? 'bg-foreground' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading || !alias.trim() || !city.trim()} className="w-full gap-2">
        {saved ? (
          <>
            <Check className="size-4" /> Guardado
          </>
        ) : loading ? (
          'Guardando...'
        ) : (
          'Guardar cambios'
        )}
      </Button>
    </form>
  )
}
