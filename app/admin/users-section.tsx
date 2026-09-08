import { ToggleActiveBtn, DeleteUserBtn } from './admin-buttons'

export type UsuarioAdmin = {
  id: string
  alias: string
  role: string
  city: string | null
  is_active: boolean | null
  created_at: string
  email: string
  confirmado: boolean
}

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

function Rol({ role }: { role: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        role === 'volunteer'
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
      }`}
    >
      {role === 'volunteer' ? '💛 Vol.' : '🤝 Bus.'}
    </span>
  )
}

function Estado({ activo }: { activo: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        activo
          ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {activo ? 'Activo' : 'Pausado'}
    </span>
  )
}

/**
 * Los usuarios del panel.
 *
 * En escritorio, la tabla de ocho columnas de siempre. En el móvil esa tabla
 * no cabe: se veían dos columnas y media y el resto había que adivinarlo
 * arrastrando. Así que ahí se pintan fichas, con lo mismo pero en vertical.
 */
export function UsersSection({ usuarios }: { usuarios: UsuarioAdmin[] }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">
        Usuarios ({usuarios.length}) — {usuarios.filter((u) => u.is_active).length} activos
      </h2>

      {/* Móvil: fichas */}
      <div className="space-y-3 sm:hidden">
        {usuarios.map((u) => (
          <div key={u.id} className="rounded-xl border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{u.alias}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {u.confirmado ? '✓ verificado' : 'sin verificar'}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Rol role={u.role} />
              <Estado activo={u.is_active ?? true} />
              {u.city && <span>{u.city}</span>}
              <span>· {fecha(u.created_at)}</span>
            </div>

            <div className="mt-3 flex gap-2">
              <ToggleActiveBtn profileId={u.id} isActive={u.is_active ?? true} />
              <DeleteUserBtn userId={u.id} alias={u.alias} />
            </div>
          </div>
        ))}
      </div>

      {/* Escritorio: la tabla de siempre */}
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {['Alias', 'Email', 'Rol', 'Ciudad', '✓', 'Estado', 'Alta', 'Acciones'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{u.alias}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3"><Rol role={u.role} /></td>
                <td className="px-4 py-3 text-muted-foreground">{u.city}</td>
                <td className="px-4 py-3 text-center text-xs">
                  {u.confirmado ? '✓' : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3"><Estado activo={u.is_active ?? true} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {fecha(u.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <ToggleActiveBtn profileId={u.id} isActive={u.is_active ?? true} />
                    <DeleteUserBtn userId={u.id} alias={u.alias} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
