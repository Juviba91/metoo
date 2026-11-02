import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { entrarConEnlace } from './actions'

export const metadata: Metadata = { title: 'Entrar', robots: { index: false } }

/**
 * Página intermedia del enlace del correo, con un botón.
 *
 * Antes el enlace se gastaba nada más abrirlo (GET). Pero muchos correos de
 * empresa (y algunos antivirus) abren cada enlace para comprobarlo antes de
 * entregar el mensaje: el 31 de octubre el de Bankinter lo abrió a los 5
 * segundos de enviarse y, cuando la persona lo pulsó, ya estaba caducado. Un
 * robot abre enlaces, pero no pulsa botones: el enlace solo se gasta al
 * enviar este formulario (POST, ver actions.ts).
 */
export default async function ConfirmarEnlace({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; redirect_to?: string }>
}) {
  const { token_hash, type, redirect_to } = await searchParams
  if (!token_hash) redirect('/auth/login?error=enlace')

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mb-10 flex justify-center">
          <Logo showWordmark={false} size={56} />
        </div>
        <h1 className="mb-2 text-xl font-semibold">Ya casi estás</h1>
        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
          Pulsa el botón para entrar en metoo.
        </p>
        <form action={entrarConEnlace}>
          <input type="hidden" name="token_hash" value={token_hash} />
          <input type="hidden" name="type" value={type ?? 'email'} />
          <input type="hidden" name="redirect_to" value={redirect_to ?? ''} />
          <Button type="submit" className="w-full">
            Entrar en metoo
          </Button>
        </form>
      </div>
    </div>
  )
}
