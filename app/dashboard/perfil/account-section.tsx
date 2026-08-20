'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { resendConfirmation } from '@/app/auth/actions'
import { sendPasswordReset } from '@/app/auth/actions'
import { toggleEmailNotifications } from '@/app/safety/actions'
import { Mail, Key, CheckCircle2, Shield, Bell } from 'lucide-react'

export function AccountSection({ email, emailConfirmed, emailNotificationsEnabled = true }: { email?: string; emailConfirmed: boolean; emailNotificationsEnabled?: boolean }) {
  const [resendLoading, setResendLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(emailNotificationsEnabled)
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [notificationsMessage, setNotificationsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleResendConfirmation() {
    setResendLoading(true)
    setResendMessage(null)
    const result = await resendConfirmation()
    if (result.success) {
      setResendMessage({ type: 'success', text: 'Correo de verificación enviado. Revisa tu bandeja de entrada.' })
    } else {
      setResendMessage({ type: 'error', text: result.error || 'Error al enviar el correo.' })
    }
    setResendLoading(false)
  }

  async function handlePasswordReset() {
    setResetLoading(true)
    setResetMessage(null)
    const result = await sendPasswordReset()
    if (result.success) {
      setResetMessage({ type: 'success', text: 'Correo para cambiar contraseña enviado. Revisa tu bandeja de entrada.' })
    } else {
      setResetMessage({ type: 'error', text: result.error || 'Error al enviar el correo.' })
    }
    setResetLoading(false)
  }

  async function handleToggleNotifications() {
    setNotificationsLoading(true)
    setNotificationsMessage(null)
    const result = await toggleEmailNotifications(!notificationsEnabled)
    if (result.success) {
      setNotificationsEnabled(!notificationsEnabled)
      setNotificationsMessage({
        type: 'success',
        text: notificationsEnabled ? 'Notificaciones deshabilitadas' : 'Notificaciones habilitadas'
      })
    } else {
      setNotificationsMessage({ type: 'error', text: result.error || 'Error al actualizar preferencias.' })
    }
    setNotificationsLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Email section */}
      <div className="rounded-lg border border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Correo electrónico</p>
            <p className="text-sm font-medium truncate">{email || '—'}</p>
            {emailConfirmed ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="size-3" /> Verificado
              </p>
            ) : (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Correo no verificado
              </p>
            )}
          </div>
        </div>

        {!emailConfirmed && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendConfirmation}
              disabled={resendLoading}
              className="w-full text-xs"
            >
              {resendLoading ? 'Enviando...' : 'Verificar correo'}
            </Button>
            {resendMessage && (
              <p className={`mt-2 text-xs ${resendMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                {resendMessage.text}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Password section */}
      <div className="rounded-lg border border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <Key className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Contraseña</p>
            <p className="text-sm font-medium">••••••••</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cambiar tu contraseña regularmente ayuda a mantener tu cuenta segura
            </p>
          </div>
        </div>

        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePasswordReset}
            disabled={resetLoading}
            className="w-full text-xs"
          >
            {resetLoading ? 'Enviando...' : 'Cambiar contraseña'}
          </Button>
          {resetMessage && (
            <p className={`mt-2 text-xs ${resetMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {resetMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* Email notifications section */}
      <div className="rounded-lg border border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <Bell className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Notificaciones por correo</p>
            <p className="text-sm font-medium">
              {notificationsEnabled ? 'Habilitadas' : 'Deshabilitadas'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Recibe notificaciones sobre nuevos mensajes y solicitudes de conexión
            </p>
          </div>
        </div>

        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleNotifications}
            disabled={notificationsLoading}
            className="w-full text-xs"
          >
            {notificationsLoading ? 'Actualizando...' : notificationsEnabled ? 'Desactivar' : 'Activar'}
          </Button>
          {notificationsMessage && (
            <p className={`mt-2 text-xs ${notificationsMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {notificationsMessage.text}
            </p>
          )}
        </div>
      </div>

      {/* Blocked users section */}
      <div className="rounded-lg border border-border px-4 py-3">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Usuarios bloqueados</p>
            <p className="text-sm font-medium">Gestionar bloqueos</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Los usuarios bloqueados no podrán contactarte
            </p>
          </div>
        </div>

        <div className="mt-3">
          <Link href="/dashboard/perfil/blocked" className="w-full">
            <Button size="sm" variant="outline" className="w-full text-xs">
              Ver usuarios bloqueados
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
