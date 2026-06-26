'use client'

import { useState } from 'react'
import { MapPin, Search, Users } from 'lucide-react'
import { ContactButton } from '@/components/contact-button'
import Link from 'next/link'

type Category = { slug: string; name: string; emoji: string }
type Match = {
  id: string
  alias: string
  city: string | null
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

  const filtered = query.trim()
    ? matches.filter(
        (m) =>
          m.alias.toLowerCase().includes(query.toLowerCase()) ||
          m.city?.toLowerCase().includes(query.toLowerCase()),
      )
    : matches

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="size-5" />
          {role === 'seeker' ? 'Voluntarios disponibles' : 'Personas que buscan apoyo'}
        </h2>
        <span className="text-sm text-muted-foreground">({filtered.length})</span>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por alias o ciudad..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((match) => {
            const cat = match.profile_categories?.[0]?.categories
            return (
              <div key={match.id} className="rounded-xl border border-border p-5">
                <div className="mb-3 flex items-start justify-between">
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
                {cat && <p className="mb-4 text-sm text-muted-foreground">{cat.name}</p>}

                {role === 'seeker' ? (
                  <ContactButton volunteerId={match.id} alreadySent={sentTo.has(match.id)} />
                ) : (
                  <div className="flex w-full items-center justify-center rounded-lg border border-border py-2 text-sm text-muted-foreground">
                    Esperando contacto
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="mb-2 text-3xl">{query ? '🔍' : '👥'}</p>
          <p>{query ? `Sin resultados para "${query}"` : 'Todavía no hay personas disponibles.'}</p>
          {!query && <p className="mt-1 text-sm">La comunidad está creciendo, vuelve pronto.</p>}
        </div>
      )}
    </div>
  )
}
