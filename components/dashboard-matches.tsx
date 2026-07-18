'use client'

import { useState, useEffect } from 'react'
import { MapPin, Search, Users } from 'lucide-react'
import { ContactButton } from '@/components/contact-button'

type Category = { slug: string; name: string; emoji: string }
type Hashtag = { id: string; slug: string; label: string }
type Match = {
  id: string
  alias: string
  city: string | null
  bio: string | null
  profile_categories: { categories: Category }[]
  profile_hashtags: { hashtags: Hashtag }[]
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
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => { setVisibleCount(12) }, [query, activeHashtag])

  // Build unique hashtag list from all matches
  const hashtagOptions = Array.from(
    new Map(
      matches
        .flatMap((m) => (m.profile_hashtags ?? []).map((ph) => ph.hashtags).filter(Boolean))
        .map((h) => [h.slug, h]),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label, 'es'))

  const filtered = matches.filter((m) => {
    const q = query.toLowerCase()
    const matchesText =
      !q ||
      m.alias.toLowerCase().includes(q) ||
      m.city?.toLowerCase().includes(q) ||
      m.bio?.toLowerCase().includes(q)
    const matchesTag =
      !activeHashtag ||
      (m.profile_hashtags ?? []).some((ph) => ph.hashtags?.slug === activeHashtag)
    return matchesText && matchesTag
  })

  const visible = filtered.slice(0, visibleCount)

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="size-5" />
          {role === 'seeker' ? 'Voluntarios disponibles' : 'Personas que buscan apoyo'}
        </h2>
        <span className="text-sm text-muted-foreground">({filtered.length})</span>
      </div>


      {/* Text search */}
      <div className="mb-3 relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por alias, ciudad o descripción..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {/* Hashtag filter chips */}
      {hashtagOptions.length > 0 && (
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveHashtag(null)}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
              !activeHashtag
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            Todos
          </button>
          {hashtagOptions.map((h) => (
            <button
              key={h.slug}
              onClick={() => setActiveHashtag(activeHashtag === h.slug ? null : h.slug)}
              className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
                activeHashtag === h.slug
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              #{h.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <>
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((match) => {
            const cat = match.profile_categories?.[0]?.categories
            const tags = (match.profile_hashtags ?? [])
              .map((ph) => ph.hashtags)
              .filter(Boolean)
              .slice(0, 4)
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
                  {cat && tags.length === 0 && <span className="text-xl">{cat.emoji}</span>}
                </div>

                {tags.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <button
                        key={tag.slug}
                        onClick={() => setActiveHashtag(tag.slug === activeHashtag ? null : tag.slug)}
                        className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                          activeHashtag === tag.slug
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                        }`}
                      >
                        #{tag.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  cat && <p className="mb-2 text-xs font-medium text-muted-foreground">{cat.name}</p>
                )}

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
        {filtered.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((n) => n + 12)}
            className="mt-4 w-full rounded-lg border border-border py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Ver más ({filtered.length - visibleCount} restantes)
          </button>
        )}
        </>
      ) : (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="mb-2 text-3xl">{query || activeHashtag ? '🔍' : '👥'}</p>
          <p>
            {query || activeHashtag
              ? 'Sin resultados con esos filtros.'
              : 'Todavía no hay personas disponibles.'}
          </p>
          {!query && !activeHashtag && (
            <p className="mt-1 text-sm">La comunidad está creciendo, vuelve pronto.</p>
          )}
        </div>
      )}
    </div>
  )
}
