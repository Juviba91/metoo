'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { reportUser } from '@/app/dashboard/actions'

const RIESGO = 'Puede estar en riesgo (su vida o la de otra persona)'

const REASONS = [
  RIESGO,
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
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setOpen(false)
    setTimeout(() => { setReason(''); setDescription(''); setDone(false); setError(null) }, 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason || submitting) return
    if (reason === 'Otro' && !description.trim()) {
      setError('Por favor describe el motivo')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await reportUser(reportedId, connectionId, reason, description)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setDone(true)
    setTimeout(handleClose, 3500)
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
                ✓ Reporte enviado. Te llegará un correo de confirmación, y otro cuando lo hayamos
                revisado.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && <p className="rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
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

                {reason === RIESGO && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
                    Si crees que hay peligro inmediato, no esperes a que lo leamos: llama al{' '}
                    <a href="tel:112" className="font-semibold underline">112</a>.
                  </p>
                )}

                {/* El DSA (art. 16) pide poder explicar el motivo. Opcional salvo
                    en «Otro», donde sin explicación no se sabe qué pasó. */}
                {reason && (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={reason === 'Otro' ? 'Describe el motivo...' : 'Si quieres, cuéntanos qué ha pasado (opcional)'}
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
