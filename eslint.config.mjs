import coreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      // Deno, no Node: tiene su propio runtime y sus propios imports
      'supabase/functions/**',
      'tests/**',
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Las respuestas anidadas de PostgREST no siempre tipan bien; los `any`
      // que quedan están acotados y comentados.
      '@typescript-eslint/no-explicit-any': 'off',
      // Los textos de la app llevan comillas en castellano. React ya escapa el
      // contenido, así que exigir &quot; solo añade ruido y empeora la lectura.
      'react/no-unescaped-entities': 'off',
    },
  },
]

export default config
