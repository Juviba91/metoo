'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { reportUser } from '@/app/dashboard/actions'

const REASONS = [
  'Contenido inapropiado',
  'Acoso o amenazas',
  'Información falsa o engañosa',
  'Comportamiento abusivo',
  'Otro',
]

export function ReportButton({
  reportedId,
  connectionId,
}: {
  reportedId: string
  connectionId: string
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  function handleClose() {
    setOpen(false)
    setTimeout(() => { setReason(''); setDescription(''); setDone(false) }, 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason || submitting) return
    setSubmitting(true)
    await reportUser(reportedId, connectionId, reason, description)
    setSubmitting(false)
    setDone(true)
    setTimeout(handleClose, 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
        aria-label="Reportar usuario"
        title="Reportar usuario"
      >
        <Flag className="size-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-sm rounded-t-2xl border border-border bg-background p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Reportar usuario</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            {done ? (
              <p className="py-6 text-center text-sm text-green-600">
                ✓ Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted has-[:checked]:border-destructive/40 has-[:checked]:bg-destructive/5"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="accent-destructive"
                      />
                      {r}
                    </label>
                  ))}
                </div>

                {reason === 'Otro' && (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe el motivo..."
                    maxLength={500}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-border bg-muted/30 p-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />
                )}

                <button
                  type="submit"
                  disabled={!reason || submitting}
                  className="w-full rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {submitting ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
