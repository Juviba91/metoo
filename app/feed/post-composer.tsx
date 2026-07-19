'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import { createPost } from './actions'

export function PostComposer({ alias }: { alias: string }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [published, setPublished] = useState(false)

  const tags = content.match(/#([a-záéíóúüñA-ZÁÉÍÓÚÜÑ0-9_-]+)/g) ?? []

  async function handleSubmit() {
    if (!content.trim() || loading) return
    setLoading(true)
    setError(null)

    const result = await createPost(content)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setContent('')
    setLoading(false)
    setPublished(true)
    setTimeout(() => setPublished(false), 3000)
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <p className="mb-3 text-sm font-semibold">{alias}</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="¿Qué quieres compartir? Usa #hashtags para etiquetar tu momento..."
        maxLength={500}
        rows={3}
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={i}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">{content.length}/500</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs text-destructive">{error}</span>}
          {published && <span className="text-xs text-green-600">¡Publicado!</span>}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || loading}
            className="gap-1.5"
          >
            <Send className="size-3.5" />
            {loading ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
