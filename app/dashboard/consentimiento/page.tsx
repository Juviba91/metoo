import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { consentimientoAlDia } from '@/lib/legal'
import { destinoSeguro } from '@/lib/destino'
import { FormularioConsentimiento } from './formulario'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Antes de seguir' }

/**
 * Renovar el consentimiento. Aquí manda el middleware a quien no lo tiene al
 * día (ver `consentimientoAlDia`), y de aquí se vuelve a donde ibas.
 *
 * No hay pestañas abajo a propósito: hasta que no aceptes no se puede ir a
 * ningún otro sitio de la app, salvo a Ajustes para darse de baja.
 */
export default async function ConsentimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const { next } = await searchParams
  const destino = destinoSeguro(next)

  const { data: perfil } = await supabase
    .from('profiles')
    .select('consentimiento_version, consentimiento_salud_en, edad_comprobada_en')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/onboarding')
  if (consentimientoAlDia(perfil)) redirect(destino)

  const nuncaDioElDeSalud = perfil.consentimiento_salud_en === null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-bold">Antes de seguir</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Hemos revisado los textos legales con un abogado y han cambiado cosas que te
            afectan. Necesitamos que los aceptes de nuevo
            {nuncaDioElDeSalud && ', y que nos des por separado el permiso para tratar lo que cuentas sobre tu salud'}
            . Seguir usando la app sin más no vale: tiene que ser un sí expreso.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground">Lo que cambia</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              Las guías por hospital ya no llevan tu alias ni enlazan a tu perfil, y hemos
              pedido a los buscadores que no las indexen.
            </li>
            <li>
              Si te das de baja, a la otra persona le queda la conversación durante un año
              como máximo. Después se borra sola.
            </li>
            <li>
              Te pedimos la fecha de nacimiento para comprobar la edad. No la guardamos.
            </li>
            <li>
              El permiso para tratar datos de salud va en su propia casilla, aparte de los
              textos.
            </li>
            <li>
              Quién está detrás de metoo: ahora es la Asociación Siette, sin ánimo de lucro.
            </li>
          </ul>
        </div>

        <FormularioConsentimiento destino={destino} />

        <p className="text-center text-xs text-muted-foreground">
          Si no estás de acuerdo, puedes{' '}
          <Link href="/dashboard/ajustes" className="underline underline-offset-2 hover:text-foreground">
            eliminar tu cuenta en Ajustes
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
