'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export type HashtagOption = { id: string; slug: string; label: string }

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function HashtagPicker({
  suggestions,
  selected,
  onChange,
}: {
  suggestions: HashtagOption[]
  selected: HashtagOption[]
  onChange: (tags: HashtagOption[]) => void
}) {
  const [query, setQuery] = useState('')

  const available = suggestions.filter((s) => !selected.some((sel) => sel.id === s.id))
  const queryTrimmed = query.trim()
  const querySlug = toSlug(queryTrimmed)

  const filtered = queryTrimmed
    ? available.filter(
        (h) =>
          h.label.toLowerCase().includes(queryTrimmed.toLowerCase()) ||
          h.slug.includes(querySlug),
      )
    : available

  const exactMatch = suggestions.find(
    (h) =>
      h.slug === querySlug || h.label.toLowerCase() === queryTrimmed.toLowerCase(),
  )
  const canCreate = queryTrimmed && !exactMatch && querySlug.length > 0

  function add(tag: HashtagOption) {
    if (selected.some((s) => s.id === tag.id)) return
    onChange([...selected, tag])
    setQuery('')
  }

  function remove(id: string) {
    onChange(selected.filter((h) => h.id !== id))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (exactMatch && !selected.some((s) => s.id === exactMatch.id)) {
        add(exactMatch)
      } else if (canCreate) {
        add({ id: `new:${querySlug}`, slug: querySlug, label: queryTrimmed })
      }
    }
    if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1].id)
    }
  }

  const showDropdown = queryTrimmed && (filtered.length > 0 || canCreate)

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {selected.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              #{tag.label}
              <button
                type="button"
                onClick={() => remove(tag.id)}
                className="hover:text-primary/70"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? 'Busca o escribe un hashtag...' : 'Añadir más...'}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-background shadow-md">
            {filtered.slice(0, 6).map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => add(tag)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/60"
              >
                <span className="text-primary">#</span>
                {tag.label}
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                onClick={() =>
                  add({ id: `new:${querySlug}`, slug: querySlug, label: queryTrimmed })
                }
                className="w-full border-t border-border px-4 py-2.5 text-left text-sm hover:bg-muted/60"
              >
                Crear{' '}
                <span className="font-medium text-primary">#{queryTrimmed}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!queryTrimmed && filtered.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filtered.slice(0, 14).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => add(tag)}
              className="rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary active:bg-muted/60"
            >
              #{tag.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
