import { vi } from 'vitest'

/**
 * Mock mínimo del cliente de Supabase.
 *
 * El query builder de PostgREST es encadenable y "thenable": `.from().select()
 * .eq()...` devuelve siempre algo sobre lo que se puede seguir encadenando, y
 * que además se puede await. Esto imita esa forma para poder probar la lógica
 * de las server actions sin tocar la red.
 *
 * Las respuestas se declaran por tabla y operación; lo que no se declare
 * devuelve `{ data: null, error: null }`.
 */
export type QueryResult = { data?: unknown; error?: unknown }

export type MockSpec = {
  user?: { id: string; email?: string } | null
  /** Respuesta por `${tabla}.${operacion}`, p.ej. 'connections.select' */
  responses?: Record<string, QueryResult | QueryResult[]>
  /** Respuesta por nombre de RPC */
  rpc?: Record<string, QueryResult>
}

export function createSupabaseMock(spec: MockSpec = {}) {
  const calls: { table: string; op: string; payload?: unknown }[] = []
  const rpcCalls: { name: string; args?: unknown }[] = []
  const pending = new Map<string, QueryResult[]>()

  for (const [key, value] of Object.entries(spec.responses ?? {})) {
    pending.set(key, Array.isArray(value) ? [...value] : [value])
  }

  function nextResponse(key: string): QueryResult {
    const queue = pending.get(key)
    if (!queue || queue.length === 0) return { data: null, error: null }
    // La última respuesta declarada se repite si se consulta de más
    return queue.length === 1 ? queue[0] : (queue.shift() as QueryResult)
  }

  function makeBuilder(table: string, op: string, payload?: unknown) {
    calls.push({ table, op, payload })
    const key = `${table}.${op}`

    const resolve = () => {
      const r = nextResponse(key)
      return { data: r.data ?? null, error: r.error ?? null }
    }

    const builder: Record<string, unknown> = {}
    // Métodos que devuelven el propio builder para seguir encadenando
    for (const m of ['select', 'eq', 'neq', 'gte', 'lte', 'lt', 'gt', 'in', 'not', 'or', 'order', 'limit', 'range']) {
      builder[m] = vi.fn(() => builder)
    }
    // Métodos terminales
    builder.single = vi.fn(async () => resolve())
    builder.maybeSingle = vi.fn(async () => resolve())
    // El builder es awaitable directamente
    builder.then = (onFulfilled: (v: unknown) => unknown) => Promise.resolve(resolve()).then(onFulfilled)

    return builder
  }

  const resolvedUser = spec.user === undefined ? { id: 'user-1' } : spec.user

  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: resolvedUser },
        error: null,
      })),
    },
    from: vi.fn((table: string) => ({
      select: (...args: unknown[]) => makeBuilder(table, 'select', args),
      insert: (payload: unknown) => makeBuilder(table, 'insert', payload),
      update: (payload: unknown) => makeBuilder(table, 'update', payload),
      delete: () => makeBuilder(table, 'delete'),
      upsert: (payload: unknown) => makeBuilder(table, 'upsert', payload),
    })),
    rpc: vi.fn(async (name: string, args?: unknown) => {
      rpcCalls.push({ name, args })
      const r = spec.rpc?.[name] ?? { data: null, error: null }
      return { data: r.data ?? null, error: r.error ?? null }
    }),
  }

  return {
    client,
    calls,
    rpcCalls,
    /** El mismo usuario que devuelve `client.auth.getUser()`, para simular
     *  también la versión memoizada `getUser()` de lib/supabase/server. */
    user: resolvedUser,
    /** ¿Se ejecutó esta operación sobre esta tabla? */
    didCall: (table: string, op: string) => calls.some((c) => c.table === table && c.op === op),
    payloadOf: (table: string, op: string) =>
      calls.find((c) => c.table === table && c.op === op)?.payload,
  }
}
