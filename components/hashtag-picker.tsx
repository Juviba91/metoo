'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { submitSuggestion } from '@/app/actions'

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
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestionText, setSuggestionText] = useState('')
  const [suggestionSent, setSuggestionSent] = useState(false)

  const available = suggestions.filter((s) => !selected.some((sel) => sel.id === s.id))
  const queryTrimmed = query.trim()

  const filtered = queryTrimmed
    ? available.filter(
        (h) =>
          h.label.toLowerCase().includes(queryTrimmed.toLowerCase()) ||
          h.slug.includes(queryTrimmed.toLowerCase()),
      )
    : available

  const showDropdown = queryTrimmed && filtered.length > 0

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
      const match = filtered[0]
      if (match) add(match)
    }
    if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1].id)
    }
  }

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault()
    if (!suggestionText.trim()) return
    await submitSuggestion(suggestionText.trim())
    setSuggestionSent(true)
    setSuggestionText('')
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
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? 'Busca un hashtag...' : 'Añadir más...'}
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
          </div>
        )}
      </div>

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

      <div className="mt-3">
        {!showSuggest && !suggestionSent && (
          <button
            type="button"
            onClick={() => setShowSuggest(true)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            ¿No encuentras tu situación? Sugerirla
          </button>
        )}

        {showSuggest && !suggestionSent && (
          <form onSubmit={handleSuggest} className="flex gap-2">
            <input
              type="text"
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder="Escribe tu sugerencia..."
              maxLength={100}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <button
              type="submit"
              disabled={!suggestionText.trim()}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              Enviar
            </button>
          </form>
        )}

        {suggestionSent && (
          <p className="text-xs text-muted-foreground">Gracias, revisaremos tu sugerencia.</p>
        )}
      </div>
    </div>
  )
}
