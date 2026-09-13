import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BajaForm } from './baja-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dejar de recibir avisos' }

export default async function BajaPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Solo se LEE: la baja la hace el botón.
  //
  // Los antivirus de correo y los previsualizadores de enlaces (Outlook,
  // Gmail) abren las URLs de los mensajes por su cuenta. Si esta página diera
  // de baja al cargarse, daría de baja a gente que ni siquiera ha abierto el
  // correo.
  const supabase = await createClient()
  const { data } = await supabase.rpc('resumen_estado', { p_token: token })
  const perfil = (data as { alias: string; activo: boolean }[] | null)?.[0]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-xl border border-border p-6 text-center">
        <Link href="/" className="text-xl font-bold tracking-tight">
          metoo.
        </Link>

        {!perfil ? (
          <>
            <h1 className="mt-6 text-lg font-semibold">Este enlace ya no vale</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Puede que la cuenta se haya eliminado, o que el enlace esté
              incompleto. Si sigues recibiendo avisos que no quieres, escríbenos
              a{' '}
              <a
                href="mailto:juan@bay-apps.com"
                className="text-foreground underline underline-offset-2"
              >
                juan@bay-apps.com
              </a>{' '}
              y lo arreglamos.
            </p>
          </>
        ) : !perfil.activo ? (
          <>
            <h1 className="mt-6 text-lg font-semibold">Ya estabas dado de baja</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No te vamos a mandar más avisos de este tipo. Los de mensajes y
              solicitudes siguen llegando: eso se cambia en tu perfil.
            </p>
          </>
        ) : (
          <BajaForm token={token} alias={perfil.alias} />
        )}

        <Link
          href="/dashboard"
          className="mt-6 inline-block text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Volver a metoo
        </Link>
      </div>
    </div>
  )
}
