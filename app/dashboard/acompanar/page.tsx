import { createClient, getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { LeidoBoton } from './leido-boton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cómo acompañar' }

const CLAVES = [
  {
    titulo: 'Hablas desde lo que viviste',
    texto:
      'Cuenta qué te ayudó a ti, qué fue difícil, qué harías distinto. Nada de diagnósticos, tratamientos ni medicación: eso es del equipo médico, y si alguien te lo pide, díselo así.',
  },
  {
    titulo: 'Primero escucha',
    texto:
      'No compares ni quites hierro («a mí fue peor», «ya pasará»). Aunque a ti ya no te pese, a esa persona le está pesando ahora. A veces lo que más ayuda es preguntar «¿cómo estás hoy?» y dejar hablar.',
  },
  {
    titulo: 'Si notas riesgo, no lo cargues tú',
    texto:
      'Si habla de quitarse la vida, de hacerse daño o de que no puede más, tómalo en serio: dale el 024 (gratis, 24 horas) y, si hay peligro inmediato, llama al 112. Después repórtalo con la bandera del chat. No tienes que resolverlo tú.',
  },
  {
    titulo: 'Lo que te cuentan se queda aquí',
    texto:
      'No pidas apellidos, teléfono ni hospital, y no saques la conversación de metoo con prisa: si un día la otra persona quiere seguir por otro sitio, que lo proponga ella. Lo que te cuente no se comparte con nadie.',
  },
  {
    titulo: 'Cuídate tú también',
    texto:
      'Puedes decir que no, tardar en contestar o ponerte como no disponible en tu perfil cuando lo necesites. Si una conversación te remueve lo tuyo, para y busca apoyo para ti.',
  },
]

/**
 * Las cinco claves para quien acompaña.
 *
 * La nota legal (I-6) pide poder acreditar una formación mínima de los
 * voluntarios: «lo he leído» queda anotado con fecha
 * (`profiles.guia_voluntario_leida_en`). No bloquea nada: se ofrece en Inicio
 * hasta que se lee.
 */
export default async function AcompanarPage() {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('profiles')
    .select('guia_voluntario_leida_en')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-6 px-6 py-8 pb-28 sm:pb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Inicio
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Cómo acompañar</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Cinco claves para quien escribe a alguien que está pasando por lo que tú ya
            pasaste. Dos minutos.
          </p>
        </div>

        <ol className="space-y-3">
          {CLAVES.map((clave, i) => (
            <li key={clave.titulo} className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold">
                {i + 1}. {clave.titulo}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{clave.texto}</p>
            </li>
          ))}
        </ol>

        <LeidoBoton yaLeida={Boolean(data?.guia_voluntario_leida_en)} />

        <p className="text-center text-xs text-muted-foreground">
          Lo completo está en las{' '}
          <Link href="/guidelines" className="underline underline-offset-2 hover:text-foreground">
            normas de la comunidad
          </Link>
          .
        </p>
      </main>

      <SiteFooter className="hidden sm:block" />
    </div>
  )
}
