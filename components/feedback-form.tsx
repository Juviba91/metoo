'use client'

import { useState } from 'react'
import { submitFeedback } from '@/app/actions'

export function FeedbackForm() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError(null)
    const result = await submitFeedback(content)
    if (result.error) {
      setError(result.error)
    } else {
      setSent(true)
      setContent('')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">Gracias por tu feedback. Lo leeremos con atención.</p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        rows={4}
        placeholder="Cuéntanos qué mejorarías, qué echas de menos o qué no funciona bien..."
        className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/1000</span>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          {loading ? 'Enviando...' : 'Enviar feedback'}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}
