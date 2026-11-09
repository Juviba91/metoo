'use client'

import { useState, useSyncExternalStore } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { plataformaDeInstalacion, type Plataforma } from '@/lib/instalar'

type EventoInstalar = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    // Lo guarda el script del layout: Chrome lanza el evento una vez al cargar
    // la página, y casi nunca se carga directamente en Ajustes.
    __metooInstalar?: EventoInstalar | null
  }
}

/**
 * Recomienda añadir metoo a la pantalla de inicio, en Ajustes, encima de los
 * avisos. Se abre como una app (sin barra del navegador) y en iPhone es la
 * única forma de recibir avisos. No sale en el ordenador ni si ya está
 * instalada.
 */
// La pestaña en la que se instaló sigue siendo del navegador (no
// `standalone`), así que hay que recordarlo aparte.
let instaladaAhora = false

function plataformaActual(): Plataforma {
  if (instaladaAhora) return 'instalada'
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return plataformaDeInstalacion({ ua: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints, standalone })
}

// El dispositivo no cambia mientras se mira la pantalla; lo único que puede
// pasar es que se instale (`appinstalled`).
function suscribirPlataforma(aviso: () => void) {
  const alInstalar = () => {
    instaladaAhora = true
    aviso()
  }
  window.addEventListener('appinstalled', alInstalar)
  return () => window.removeEventListener('appinstalled', alInstalar)
}

// El script del layout guarda el evento antes de que este listener exista; este
// solo avisa a React para que lo lea.
function suscribirEvento(aviso: () => void) {
  window.addEventListener('beforeinstallprompt', aviso)
  return () => window.removeEventListener('beforeinstallprompt', aviso)
}

export function InstalarApp() {
  const detectada = useSyncExternalStore<Plataforma | null>(suscribirPlataforma, plataformaActual, () => null)
  const guardado = useSyncExternalStore(suscribirEvento, () => window.__metooInstalar ?? null, () => null)
  const [usado, setUsado] = useState(false)
  const [aceptada, setAceptada] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  const plataforma = aceptada ? 'instalada' : detectada
  // El evento solo se puede usar una vez.
  const evento = usado ? null : guardado

  async function instalar() {
    if (!evento) return
    setOcupado(true)
    try {
      await evento.prompt()
      const { outcome } = await evento.userChoice
      window.__metooInstalar = null
      setUsado(true)
      if (outcome === 'accepted') setAceptada(true)
    } finally {
      setOcupado(false)
    }
  }

  if (plataforma !== 'ios' && plataforma !== 'android') return null

  return (
    <div className="rounded-xl border border-border px-4 py-3">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 size-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Ten metoo en tu pantalla de inicio</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Se abre como una app, sin buscarla en el navegador
            {plataforma === 'ios' ? ', y en iPhone es la única forma de recibir avisos.' : '.'}
          </p>
          {plataforma === 'ios' ? (
            <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs text-muted-foreground">
              <li>
                Pulsa <strong className="text-foreground">Compartir</strong> (el cuadrado con la flecha hacia
                arriba).
              </li>
              <li>
                Elige <strong className="text-foreground">Añadir a pantalla de inicio</strong>.
              </li>
            </ol>
          ) : (
            !evento && (
              <p className="mt-2 text-xs text-muted-foreground">
                Abre el menú del navegador (⋮) y elige{' '}
                <strong className="text-foreground">Instalar aplicación</strong> o{' '}
                <strong className="text-foreground">Añadir a pantalla de inicio</strong>.
              </p>
            )
          )}
        </div>
      </div>

      {plataforma === 'android' && evento && (
        <div className="mt-3">
          <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={instalar} disabled={ocupado}>
            {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
            Instalar metoo
          </Button>
        </div>
      )}
    </div>
  )
}
