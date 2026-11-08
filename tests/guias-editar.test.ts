import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createSupabaseMock } from './helpers/supabase-mock'

const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidatePath }))

const state = { mock: createSupabaseMock() }
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => state.mock.client,
  getUser: async () => state.mock.user,
}))

const { editarAportacion } = await import('@/app/dashboard/guias/actions')

describe('editarAportacion', () => {
  it('edita por la función de la base y refresca las páginas de guías', async () => {
    state.mock = createSupabaseMock({ user: { id: 'u1' } })

    const res = await editarAportacion('r1', 'Texto corregido de mi respuesta')

    expect(res.success).toBe(true)
    expect(state.mock.rpcCalls).toEqual([
      { name: 'editar_aportacion', args: { p_id: 'r1', p_contenido: 'Texto corregido de mi respuesta' } },
    ])
    expect(revalidatePath).toHaveBeenCalledWith('/guias/[tema]', 'page')
  })

  it('sin sesión no llega a la base', async () => {
    state.mock = createSupabaseMock({ user: null })

    const res = await editarAportacion('r1', 'Texto corregido de mi respuesta')

    expect(res.error).toBeTruthy()
    expect(state.mock.rpcCalls).toEqual([])
  })

  it('devuelve el mensaje de la base, que está escrito para leerse', async () => {
    state.mock = createSupabaseMock({
      user: { id: 'u1' },
      rpc: { editar_aportacion: { error: { message: 'No puedes editar esta aportación' } } },
    })

    expect((await editarAportacion('r9', 'Texto de otra persona, no mío')).error).toBe(
      'No puedes editar esta aportación',
    )
  })
})

// La frontera de verdad es la función de la base. Se comprueba su definición en
// la migración: solo la autora, nada de ocultas, y cerrada a quien no tiene sesión.
describe('editar_aportacion en la migración', () => {
  const sql = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '20261113_pendientes_guias.sql'),
    'utf8',
  )
  const funcion = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.editar_aportacion'))

  it('solo toca respuestas de quien llama y que no estén ocultas', () => {
    expect(funcion).toMatch(/WHERE id = p_id AND autor_id = v_user AND NOT oculta/)
  })

  it('exige sesión y una cuenta activa', () => {
    expect(funcion).toMatch(/v_user uuid := auth\.uid\(\)/)
    expect(funcion).toMatch(/deleted_at IS NULL/)
  })

  it('no la puede ejecutar quien no tiene sesión', () => {
    expect(funcion).toMatch(/REVOKE ALL ON FUNCTION public\.editar_aportacion\(uuid, text\) FROM PUBLIC, anon/)
    expect(funcion).toMatch(/GRANT EXECUTE ON FUNCTION public\.editar_aportacion\(uuid, text\) TO authenticated/)
  })
})

describe('borrarAportacion', async () => {
  const { borrarAportacion } = await import('@/app/dashboard/guias/actions')

  it('borra por la función de la base y refresca la guía, el índice y el perfil', async () => {
    state.mock = createSupabaseMock({ user: { id: 'u1' } })
    revalidatePath.mockClear()

    const res = await borrarAportacion('r1')

    expect(res.success).toBe(true)
    expect(state.mock.rpcCalls).toEqual([{ name: 'borrar_aportacion', args: { p_id: 'r1' } }])
    expect(revalidatePath).toHaveBeenCalledWith('/guias/[tema]', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/perfil')
  })

  it('sin sesión no llega a la base', async () => {
    state.mock = createSupabaseMock({ user: null })

    expect((await borrarAportacion('r1')).error).toBeTruthy()
    expect(state.mock.rpcCalls).toEqual([])
  })
})

describe('borrar_aportacion en la migración', () => {
  const sql = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '20261114_borrar_aportacion_y_chat_equipo_en_vivo.sql'),
    'utf8',
  )

  it('solo borra respuestas de quien llama', () => {
    expect(sql).toMatch(/DELETE FROM guia_respuestas WHERE id = p_id AND autor_id = v_user/)
  })

  it('no la puede ejecutar quien no tiene sesión', () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.borrar_aportacion\(uuid\) FROM PUBLIC, anon/)
  })
})
