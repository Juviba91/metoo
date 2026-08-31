'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageSquareHeart, X } from 'lucide-react'
import { submitFeedback } from '@/app/actions'

/**
 * Burbuja flotante para mandar feedback desde cualquier pantalla de la app.
 *
 * En móvil se coloca por encima de la barra inferior (que mide unos 64px más
 * el área segura del dispositivo); en escritorio, pegada a la esquina.
 */
export function FeedbackBubble() {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  // Cerrar con Escape, como cualquier panel modal
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    const result = await submitFeedback(trimmed)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSent(true)
    setContent('')
    // Se cierra sola tras el acuse de recibo
    setTimeout(() => {
      setOpen(false)
      setSent(false)
    }, 2000)
  }

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
      {open && (
        <div className="pointer-events-auto w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-background p-4 shadow-lg">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">¿Nos cuentas?</p>
              <p className="text-xs text-muted-foreground">
                Lo lee una persona, no un robot.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="-mr-1 -mt-1 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {sent ? (
            <p className="py-3 text-sm text-muted-foreground">
              ¡Gracias! Lo leeremos con atención.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Qué mejorarías, qué echas de menos o qué no funciona bien..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{content.length}/1000</span>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {loading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar feedback' : 'Enviar feedback'}
        aria-expanded={open}
        className="pointer-events-auto flex size-12 items-center justify-center rounded-full border border-border bg-background shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {open ? (
          <X className="size-5 text-muted-foreground" />
        ) : (
          <MessageSquareHeart className="size-5 text-foreground" />
        )}
      </button>
    </div>
  )
}
