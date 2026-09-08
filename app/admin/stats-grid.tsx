export type Metrica = { label: string; value: number; alert?: boolean }

/**
 * La rejilla de números del panel.
 *
 * Son diez tarjetas. A dos columnas en el móvil salían cinco filas, y había
 * que bajar media pantalla antes de llegar a nada que se lea. A tres columnas
 * y con menos aire son cuatro filas de la mitad de alto.
 */
export function StatsGrid({ metricas }: { metricas: readonly Metrica[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {metricas.map((m) => (
        <div
          key={m.label}
          className={`rounded-xl border px-2 py-3 text-center sm:p-4 ${
            m.alert ? 'border-destructive/40 bg-destructive/5' : 'border-border'
          }`}
        >
          <p className={`text-xl font-bold sm:text-2xl ${m.alert ? 'text-destructive' : ''}`}>
            {m.value}
          </p>
          <p className="text-[0.7rem] leading-tight text-muted-foreground sm:text-xs">
            {m.label}
          </p>
        </div>
      ))}
    </div>
  )
}
