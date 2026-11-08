'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LIMITE_MENSAJE_EQUIPO } from '@/lib/equipo'

export type MensajeVista = { id: number; del_equipo: boolean; contenido: string; creado_en: string }

const FORMATO_HORA = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
const FORMATO_DIA = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' })

function dia(iso: string) {
  const t = FORMATO_DIA.format(new Date(iso))
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/**
 * La conversación con el equipo, con el mismo aspecto y manejo que el chat de
 * siempre: burbujas, caja de escribir abajo, Enter envía en el ordenador y
 * Mayús+Enter salta de línea (en el móvil Enter es salto de línea).
 *
 * Sirve a los dos lados: `soyEquipo` dice de qué lado estás, y así tus mensajes
 * van a la derecha y en negro, los del otro a la izquierda.
 *
 * Se refresca sola cada pocos segundos mientras la pestaña está a la vista (no
 * hay conexión en vivo: es la misma tabla y la leen los dos lados con la clave
 * que les toca), y deja de hacerlo si nadie toca nada en 5 minutos: una pestaña
 * olvidada abierta era una invocación al servidor cada 8 segundos.
 *
 * Tras enviar, el mensaje sale al momento y se queda hasta que el servidor lo
 * devuelve; así un refresco que salió antes del envío no lo hace parpadear.
 */
const INACTIVIDAD_MAX_MS = 5 * 60_000
const ULTIMOS_A_COMPARAR = 5
export function ChatEquipo({
  mensajes,
  soyEquipo,
  enviar,
  placeholder = 'Escribe un mensaje...',
  vacio,
  nota,
  alVer,
  refrescarCadaMs = 8000,
  enVivoPara,
}: {
  mensajes: MensajeVista[]
  soyEquipo: boolean
  enviar: (contenido: string) => Promise<{ success?: boolean; error?: string }>
  placeholder?: string
  vacio: string
  nota?: React.ReactNode
  /** Se llama al abrir la conversación y cada vez que llega algo nuevo (marcar leído). */
  alVer?: () => void
  refrescarCadaMs?: number
  /**
   * Id de la persona cuyo hilo es (solo en su lado). Con él, los mensajes
   * nuevos llegan al momento por Realtime; el sondeo queda de respaldo por si
   * se corta. El panel de admin no lo pasa: la sesión de Juan no puede leer en
   * vivo los hilos de los demás (la política solo deja ver los propios).
   */
  enVivoPara?: string
}) {
  const router = useRouter()
  // Lo que he enviado y el servidor aún no ha devuelto. La lista que se pinta
  // sale de las props (la verdad) más esto, no de un estado copiado de ellas.
  const [pendientes, setPendientes] = useState<MensajeVista[]>([])
  const ultimos = mensajes.slice(-ULTIMOS_A_COMPARAR)
  const lista = [
    ...mensajes,
    ...pendientes.filter((p) => !ultimos.some((m) => m.del_equipo === p.del_equipo && m.contenido === p.contenido)),
  ]

  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fondo = useRef<HTMLDivElement>(null)
  const entrada = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fondo.current?.scrollIntoView({ behavior: 'instant' })
  }, [lista.length])

  // Al abrir y cada vez que llega algo nuevo del otro lado.
  const ultimoAjeno = [...mensajes].reverse().find((m) => m.del_equipo !== soyEquipo)?.id
  useEffect(() => {
    alVer?.()
    // `alVer` es una server action estable; solo importa cuándo llega algo nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimoAjeno])

  // En vivo: cada mensaje nuevo de este hilo repinta la conversación.
  const [enVivo, setEnVivo] = useState(false)
  useEffect(() => {
    if (!enVivoPara) return
    const supabase = createClient()
    let activo = true
    let canal: ReturnType<typeof supabase.channel> | null = null

    function suscribir() {
      if (!activo) return
      canal = supabase
        .channel(`equipo-${enVivoPara}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'mensajes_equipo', filter: `usuario_id=eq.${enVivoPara}` },
          () => router.refresh(),
        )
        .subscribe((estado) => {
          if (!activo) return
          setEnVivo(estado === 'SUBSCRIBED')
          // Si se corta, vuelve el sondeo y se reintenta, como en el chat normal.
          if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') {
            setTimeout(() => {
              if (canal) supabase.removeChannel(canal)
              suscribir()
            }, 3000)
          }
        })
    }

    suscribir()
    return () => {
      activo = false
      if (canal) supabase.removeChannel(canal)
    }
  }, [enVivoPara, router])

  const ultimaActividad = useRef(0)
  useEffect(() => {
    // Con Realtime conectado no hace falta preguntar cada pocos segundos, pero
    // se sigue preguntando cada minuto: un canal puede quedar «conectado» sin
    // recibir nada (p. ej. si la tabla no está en la publicación) y así el
    // chat nunca se queda congelado.
    const cada = enVivo ? 60_000 : refrescarCadaMs
    ultimaActividad.current = Date.now()
    const tocar = () => {
      ultimaActividad.current = Date.now()
    }
    const alVolver = () => {
      if (document.visibilityState === 'visible') tocar()
    }
    window.addEventListener('pointerdown', tocar)
    window.addEventListener('keydown', tocar)
    document.addEventListener('visibilitychange', alVolver)
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - ultimaActividad.current < INACTIVIDAD_MAX_MS) {
        router.refresh()
      }
    }, cada)
    return () => {
      clearInterval(id)
      window.removeEventListener('pointerdown', tocar)
      window.removeEventListener('keydown', tocar)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [router, refrescarCadaMs, enVivo])

  async function alEnviar(e?: React.FormEvent) {
    e?.preventDefault()
    const contenido = texto.trim()
    if (!contenido || enviando) return
    setEnviando(true)
    setError(null)
    try {
      const res = await enviar(contenido)
      if (res.error) {
        setError(res.error)
        return
      }
      setPendientes((p) => [...p, { id: -Date.now(), del_equipo: soyEquipo, contenido, creado_en: new Date().toISOString() }])
      setTexto('')
      entrada.current?.focus()
      // Sin router.refresh(): la acción ya revalida esta ruta y la vuelve a pintar.
    } catch {
      // Red caída o acción que no responde: sin esto el botón se quedaba
      // desactivado y Enter dejaba de enviar hasta recargar.
      setError('No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {lista.length === 0 ? (
          <p className="mx-auto mt-8 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">{vacio}</p>
        ) : (
          <div className="space-y-2">
            {lista.map((m, i) => {
              const d = dia(m.creado_en)
              const separador = i === 0 || d !== dia(lista[i - 1].creado_en)
              const mio = m.del_equipo === soyEquipo
              return (
                <div key={m.id}>
                  {separador && (
                    <div className="my-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />
                      <span>{d}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        mio ? 'rounded-br-sm bg-burbuja text-burbuja-foreground' : 'rounded-bl-sm bg-muted text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-line break-words">{m.contenido}</p>
                      <p className={`mt-0.5 text-xs ${mio ? 'text-burbuja-foreground/60' : 'text-muted-foreground'}`} suppressHydrationWarning>
                        {FORMATO_HORA.format(new Date(m.creado_en))}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div ref={fondo} />
      </div>

      <form onSubmit={alEnviar} className="pb-safe flex shrink-0 flex-col gap-2 border-t border-border bg-background px-4 pt-3">
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={entrada}
              rows={1}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(pointer: fine)').matches) {
                  e.preventDefault()
                  void alEnviar()
                }
              }}
              placeholder={placeholder}
              maxLength={LIMITE_MENSAJE_EQUIPO}
              autoComplete="off"
              className="block max-h-40 w-full resize-none rounded-3xl border border-border bg-muted/40 px-4 py-3 text-sm leading-snug outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            {texto.length > 1500 && (
              <span className={`absolute bottom-1 right-4 text-[10px] tabular-nums ${texto.length > 1900 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {LIMITE_MENSAJE_EQUIPO - texto.length}
              </span>
            )}
          </div>
          <Button type="submit" size="icon" disabled={enviando || !texto.trim()} className="size-11 shrink-0 rounded-full" aria-label="Enviar">
            <Send className="size-4" />
          </Button>
        </div>
        {nota && <p className="text-balance pb-1 text-center text-xs leading-snug text-muted-foreground">{nota}</p>}
      </form>
    </div>
  )
}
