'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createHashtag } from '@/app/actions'

export type HashtagOption = { id: string; slug: string; label: string }

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
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const available = suggestions.filter((s) => !selected.some((sel) => sel.id === s.id))
  const queryTrimmed = query.trim()

  const filtered = queryTrimmed
    ? available.filter(
        (h) =>
          h.label.toLowerCase().includes(queryTrimmed.toLowerCase()) ||
          h.slug.includes(queryTrimmed.toLowerCase()),
      )
    : available

  const exactMatch = filtered.some(
    (h) => h.label.toLowerCase() === queryTrimmed.toLowerCase(),
  )
  const showDropdown = !!queryTrimmed
  const showCreate = queryTrimmed.length >= 2 && !exactMatch

  function add(tag: HashtagOption) {
    if (selected.some((s) => s.id === tag.id)) return
    onChange([...selected, tag])
    setQuery('')
    setCreateError(null)
  }

  function remove(id: string) {
    onChange(selected.filter((h) => h.id !== id))
  }

  async function handleCreate() {
    if (!queryTrimmed || creating) return
    setCreating(true)
    setCreateError(null)
    const result = await createHashtag(queryTrimmed)
    setCreating(false)
    if (result.error) {
      setCreateError(result.error)
      return
    }
    if (result.hashtag) add(result.hashtag)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[0]) {
        add(filtered[0])
      } else if (showCreate) {
        handleCreate()
      }
    }
    if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1].id)
    }
  }

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
          onChange={(e) => { setQuery(e.target.value); setCreateError(null) }}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? 'Busca o crea un hashtag...' : 'Añadir más...'}
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
            {showCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full border-t border-border px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted/60 disabled:opacity-50"
              >
                {creating ? 'Creando...' : <>Crear <span className="font-medium text-foreground">#{queryTrimmed}</span></>}
              </button>
            )}
          </div>
        )}
      </div>

      {createError && <p className="mt-1 text-xs text-destructive">{createError}</p>}

      {!queryTrimmed && filtered.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filtered.slice(0, 20).map((tag) => (
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
