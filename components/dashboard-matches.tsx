'use client'

import { useState, useEffect } from 'react'
import { MapPin, Search, Users } from 'lucide-react'
import { ContactButton } from '@/components/contact-button'
import Link from 'next/link'

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
  connectedTo,
  allHashtags = [],
}: {
  matches: Match[]
  role: 'seeker' | 'volunteer'
  connectedTo: Record<string, string>
  allHashtags?: Hashtag[]
}) {
  const [query, setQuery] = useState('')
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(12)

  useEffect(() => { setVisibleCount(12) }, [query, activeHashtag])

  // Count matches per hashtag
  const matchCountBySlug = matches.reduce<Record<string, number>>((acc, m) => {
    for (const ph of m.profile_hashtags ?? []) {
      const slug = ph.hashtags?.slug
      if (slug) acc[slug] = (acc[slug] ?? 0) + 1
    }
    return acc
  }, {})

  // Show curated hashtags that have at least one match, sorted by count desc then label
  const hashtagOptions = allHashtags
    .filter((h) => (matchCountBySlug[h.slug] ?? 0) > 0)
    .sort((a, b) => (matchCountBySlug[b.slug] ?? 0) - (matchCountBySlug[a.slug] ?? 0) || a.label.localeCompare(b.label, 'es'))

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

      {/* Hashtag filter chips */}
      {hashtagOptions.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Filtrar por situación</p>
          <div className="flex flex-wrap gap-2">
            {hashtagOptions.map((h) => (
              <button
                key={h.slug}
                onClick={() => setActiveHashtag(activeHashtag === h.slug ? null : h.slug)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  activeHashtag === h.slug
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                }`}
              >
                #{h.label}
                <span className={`tabular-nums ${activeHashtag === h.slug ? 'text-background/70' : 'text-muted-foreground/60'}`}>
                  {matchCountBySlug[h.slug]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o ciudad..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full border border-border bg-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/20"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>

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
                      <Link
                        href={`/dashboard/perfil/${match.id}`}
                        className="font-semibold hover:underline"
                      >
                        {match.alias}
                      </Link>
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

                  <div className="mt-auto flex flex-col gap-2">
                    {role === 'seeker' ? (
                      <ContactButton volunteerId={match.id} alreadySent={!!connectedTo[match.id]} />
                    ) : connectedTo[match.id] ? (
                      <Link
                        href={`/dashboard/chat/${connectedTo[match.id]}`}
                        className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
                      >
                        Ver conversación →
                      </Link>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm text-muted-foreground">
                          Esperando contacto
                        </div>
                        <p className="text-center text-xs text-muted-foreground/70">
                          Esta persona aún no te ha escrito. Las personas que buscan apoyo inician el contacto.
                        </p>
                      </div>
                    )}
                    <Link
                      href={`/dashboard/perfil/${match.id}`}
                      className="text-center text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Ver perfil →
                    </Link>
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
