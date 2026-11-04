import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Lo que protege el chat del equipo vive en la migración, no en el código: la
 * política de INSERT, los permisos por columna y las guardas de las funciones.
 * Si alguien las redefine y pierde una, la app seguiría funcionando y un usuario
 * podría escribir como equipo o preguntar por el globo de otro. Estos tests lo
 * vigilan sobre la última definición en las migraciones.
 */
const DIR = join(process.cwd(), 'supabase', 'migrations')
const sql = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => readFileSync(join(DIR, f), 'utf8'))

function ultimaFuncion(nombre: string): string {
  const defs = sql.flatMap(
    (t) => t.match(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${nombre}\\([\\s\\S]*?\\$(?:function)?\\$;`, 'g')) ?? [],
  )
  return defs[defs.length - 1] ?? ''
}

const migracion = readFileSync(join(DIR, '20261108_chat_del_equipo.sql'), 'utf8')

describe('chat del equipo: seguridad de la migración', () => {
  it('quien escribe como persona no puede hacerse pasar por el equipo ni marcar «automático»', () => {
    expect(migracion).toMatch(/FOR INSERT TO authenticated\s+WITH CHECK \(usuario_id = \(SELECT auth\.uid\(\)\) AND del_equipo = false AND automatico = false\)/)
  })

  it('el permiso de INSERT por columnas solo incluye lo que la persona puede poner', () => {
    const grant = migracion.match(/GRANT INSERT \(([^)]*)\) ON public\.mensajes_equipo TO authenticated/)?.[1] ?? ''
    expect(grant.split(',').map((c) => c.trim()).sort()).toEqual(['contenido', 'del_equipo', 'usuario_id'])
  })

  it('nadie con sesión puede editar ni borrar mensajes', () => {
    expect(migracion).not.toMatch(/GRANT[^;]*\b(UPDATE|DELETE)\b[^;]*mensajes_equipo/)
  })

  it('get_unread_count sigue contestando solo por uno mismo', () => {
    const def = ultimaFuncion('get_unread_count')
    expect(def.match(/user_uuid = auth\.uid\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  })

  it('el aviso por correo no cuenta como ya avisado un mensaje que se leyó ni la bienvenida', () => {
    const def = ultimaFuncion('avisar_mensaje_equipo')
    expect(def).toMatch(/e\.leido_en IS NULL AND NOT e\.automatico/)
  })

  it('el aviso por correo no lleva lo escrito', () => {
    const def = ultimaFuncion('avisar_mensaje_equipo')
    expect(def).not.toMatch(/NEW\.contenido/)
  })

  it('las funciones que se ejecutan solas no son llamables por nadie desde fuera', () => {
    for (const f of ['mensajes_equipo_antes', 'avisar_mensaje_equipo', 'bienvenida_equipo']) {
      expect(migracion).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${f}\\(\\) FROM PUBLIC, anon, authenticated`))
    }
  })
})
