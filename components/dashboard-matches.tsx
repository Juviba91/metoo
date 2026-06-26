'use client'

import { useState } from 'react'
import { MapPin, Search, Users } from 'lucide-react'
import { ContactButton } from '@/components/contact-button'

type Category = { slug: string; name: string; emoji: string }
type Match = {
  id: string
  alias: string
  city: string | null
  bio: string | null
  profile_categories: { categories: Category }[]
}

export function DashboardMatches({
  matches,
  role,
  sentTo,
}: {
  matches: Match[]
  role: 'seeker' | 'volunteer'
  sentTo: Set<string>
}) {
  const [query, setQuery] = useState('')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  // Build unique category list from current matches
  const categoryOptions = Array.from(
    new Map(
      matches
        .flatMap((m) => m.profile_categories.map((pc) => pc.categories).filter(Boolean))
        .map((c) => [c.slug, c]),
    ).values(),
  )

  const filtered = matches.filter((m) => {
    const q = query.toLowerCase()
    const matchesText =
      !q ||
      m.alias.toLowerCase().includes(q) ||
      m.city?.toLowerCase().includes(q) ||
      m.bio?.toLowerCase().includes(q)
    const matchesCat =
      !selectedSlug ||
      m.profile_categories.some((pc) => pc.categories?.slug === selectedSlug)
    return matchesText && matchesCat
  })

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="size-5" />
          {role === 'seeker' ? 'Voluntarios disponibles' : 'Personas que buscan apoyo'}
        </h2>
        <span className="text-sm text-muted-foreground">({filtered.length})</span>
      </div>

      {/* Search + category filter */}
      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por alias, ciudad o descripción..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
        {categoryOptions.length > 1 && (
          <select
            value={selectedSlug ?? ''}
            onChange={(e) => setSelectedSlug(e.target.value || null)}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          >
            <option value="">Todas las situaciones</option>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((match) => {
            const cat = match.profile_categories?.[0]?.categories
            return (
              <div key={match.id} className="flex flex-col rounded-xl border border-border p-5">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{match.alias}</h3>
                    {match.city && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {match.city}
                      </p>
                    )}
                  </div>
                  {cat && <span className="text-xl">{cat.emoji}</span>}
                </div>

                {cat && <p className="mb-2 text-xs font-medium text-muted-foreground">{cat.name}</p>}

                {match.bio && (
                  <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {match.bio}
                  </p>
                )}

                <div className="mt-auto">
                  {role === 'seeker' ? (
                    <ContactButton volunteerId={match.id} alreadySent={sentTo.has(match.id)} />
                  ) : (
                    <div className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm text-muted-foreground">
                      Esperando contacto
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="mb-2 text-3xl">{query || selectedSlug ? '🔍' : '👥'}</p>
          <p>
            {query || selectedSlug
              ? 'Sin resultados con esos filtros.'
              : 'Todavía no hay personas disponibles.'}
          </p>
          {!query && !selectedSlug && (
            <p className="mt-1 text-sm">La comunidad está creciendo, vuelve pronto.</p>
          )}
        </div>
      )}
    </div>
  )
}
