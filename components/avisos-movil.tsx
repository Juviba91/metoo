'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { guardarSuscripcion, quitarSuscripcion } from '@/app/dashboard/ajustes/push-actions'

type Estado = 'cargando' | 'no-soportado' | 'ios-sin-instalar' | 'bloqueado' | 'activo' | 'inactivo'

function claveAplicacion(base64: string): Uint8Array {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const b = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(b, (c) => c.charCodeAt(0))
}

/**
 * Avisos en este móvil (push), en Ajustes.
 *
 * Hasta ahora solo había correo, y en un chat llega tarde. En iPhone los
 * avisos solo funcionan con metoo añadida a la pantalla de inicio: si no lo
 * está, se explica cómo en vez de enseñar un botón que no haría nada.
 */
export function AvisosMovil() {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

  useEffect(() => {
    let vivo = true
    async function comprobar() {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const instalada =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true
      let siguiente: Estado
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !clave) {
        siguiente = ios && !instalada ? 'ios-sin-instalar' : 'no-soportado'
      } else if (Notification.permission === 'denied') {
        siguiente = 'bloqueado'
      } else {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const sub = await reg.pushManager.getSubscription()
        siguiente = sub ? 'activo' : 'inactivo'
      }
      if (vivo) setEstado(siguiente)
    }
    comprobar().catch(() => vivo && setEstado('no-soportado'))
    return () => {
      vivo = false
    }
  }, [clave])

  async function activar() {
    setOcupado(true)
    setError(null)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setEstado(permiso === 'denied' ? 'bloqueado' : 'inactivo')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveAplicacion(clave!) as BufferSource,
      })
      const res = await guardarSuscripcion(sub.toJSON() as never)
      if (res.error) {
        await sub.unsubscribe()
        setError(res.error)
        return
      }
      setEstado('activo')
    } catch {
      setError('No se pudieron activar los avisos en este dispositivo.')
    } finally {
      setOcupado(false)
    }
  }

  async function desactivar() {
    setOcupado(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await quitarSuscripcion(sub.endpoint)
        await sub.unsubscribe()
      }
      setEstado('inactivo')
    } finally {
      setOcupado(false)
    }
  }

  // Sin la clave pública configurada en el servidor no hay avisos posibles:
  // mejor no enseñar nada que un botón que no funciona.
  if (!clave) return null

  const titulo =
    estado === 'activo' ? 'Activados' : estado === 'inactivo' ? 'Desactivados' : estado === 'cargando' ? '…' : 'No disponibles'

  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <div className="flex items-start gap-3">
        <Smartphone className="mt-0.5 size-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Avisos en este móvil</p>
          <p className="text-sm font-medium">{titulo}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {estado === 'ios-sin-instalar' ? (
              <>
                En iPhone, primero añade metoo a la pantalla de inicio: en Safari, pulsa{' '}
                <strong className="text-foreground">Compartir</strong> y luego{' '}
                <strong className="text-foreground">Añadir a pantalla de inicio</strong>. Ábrela desde
                ahí y vuelve aquí.
              </>
            ) : estado === 'bloqueado' ? (
              'Los avisos están bloqueados para metoo en este navegador. Puedes permitirlos en los ajustes del navegador o del móvil.'
            ) : estado === 'no-soportado' ? (
              'Este navegador no permite avisos.'
            ) : (
              'Te avisa al momento cuando alguien te escribe o quiere hablar contigo. Dice quién, nunca lo que te ha escrito.'
            )}
          </p>
        </div>
      </div>

      {(estado === 'activo' || estado === 'inactivo') && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs"
            onClick={estado === 'activo' ? desactivar : activar}
            disabled={ocupado}
          >
            {ocupado ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : estado === 'activo' ? (
              <BellOff className="size-3.5" />
            ) : (
              <Bell className="size-3.5" />
            )}
            {estado === 'activo' ? 'Desactivar' : 'Activar avisos'}
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
