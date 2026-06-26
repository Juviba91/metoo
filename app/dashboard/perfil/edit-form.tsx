'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateProfile } from '@/app/dashboard/actions'
import { Check } from 'lucide-react'

export function EditForm({
  initial,
  role,
}: {
  initial: { alias: string; city: string; bio: string | null }
  role: 'seeker' | 'volunteer'
}) {
  const [alias, setAlias] = useState(initial.alias)
  const [city, setCity] = useState(initial.city ?? '')
  const [bio, setBio] = useState(initial.bio ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!alias.trim() || !city.trim()) return
    setLoading(true)
    setError(null)
    setSaved(false)

    const result = await updateProfile({ alias, city, bio })

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
