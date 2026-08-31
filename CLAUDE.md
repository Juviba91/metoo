# metoo — notas para Claude

App de apoyo entre iguales: conecta a quien atraviesa un momento difícil con
voluntarios que han vivido lo mismo. Next.js 16 (App Router) + Supabase.
Todo el producto está en español; el código y los comentarios también.

---

## ⚠️ Supabase: hay DOS proyectos y el que sale por defecto NO es este

| | Proyecto | Ref |
|---|---|---|
| ✅ **Este repo** | **MeToo** | **`rsqjecmcplscuyibfncp`** |
| ❌ Otra app del usuario | wichwoch (relojes) | `kmxpachollvsiytppvyy` |

`list_projects` devuelve **solo wichwoch**, porque MeToo vive en la
organización de la integración de Vercel (`vercel_icfg_…`) y el conector está
autorizado en la personal. Si te fías de esa lista, escribes en la app
equivocada. **Ya ha pasado dos veces**: una migración y unos perfiles de prueba
acabaron en wichwoch.

Antes de cualquier consulta, pasa el ref de MeToo explícitamente. Para
confirmar dónde estás:

```sql
SELECT current_database(), current_user;
-- MeToo    -> usuario supabase_read_only_user
-- wichwoch -> usuario postgres
```

**El acceso a MeToo es de solo lectura** (`supabase_read_only_user`). Los
`INSERT`/`UPDATE`/`DELETE`/`ALTER` fallan con
`cannot execute … in a read-only transaction`. No es un fallo de la base: es el
permiso del conector. Las escrituras las ejecuta el usuario en
https://supabase.com/dashboard/project/rsqjecmcplscuyibfncp/sql/new — pásale el
SQL listo para copiar y pegar.

En wichwoch **sí** hay escritura. Úsalo solo como banco de pruebas (esquema
aparte, y bórralo al terminar), nunca para nada de metoo.

### Migraciones

Van en `supabase/migrations/`, pero **el repo no contiene el esquema base**:
bastantes tablas y políticas se crearon desde el panel. No deduzcas que algo
falta solo porque no esté en los ficheros — compruébalo contra `pg_policies` o
`information_schema`. (Un aviso de "falta la política INSERT de hashtags"
resultó ser falsa alarma justo por esto.)

**La migración se aplica ANTES de desplegar.** Si el código pide una columna
que aún no existe, las páginas revientan. Al abrir un PR que necesite
migración, dilo en el cuerpo y verifica que está aplicada antes de mergear.

### Datos de prueba

Las cuentas falsas usan correo `@test.local` y nunca han iniciado sesión. Las
reales son gmail/hotmail. Para distinguirlas:

```sql
SELECT p.alias, u.email, u.last_sign_in_at
  FROM profiles p JOIN auth.users u ON u.id = p.id;
```

---

## Decisiones de producto que ya están tomadas

- **El anonimato es una función, no una carencia.** Nada de fotos, nombres
  reales ni hospital concreto: es lo que hace que alguien se atreva a escribir,
  y el hospital en un pueblo pequeño identifica a una persona. Existen sin usar
  `avatar_url`, `display_name` y `hospital_id`; déjalos así.
- **Nada de más texto libre.** Los perfiles tienen bio de 300 caracteres y la
  gente escribe ~98 de media: quien está en mitad de un diagnóstico o un duelo
  no redacta. Lo que se añada, de opción cerrada (ver `lib/profile-fields.ts`).
- **La bio es pública** para el rol contrario, no solo para tus contactos. Si
  tocas ese texto, que no prometa privacidad que no existe.
- Quien busca apoyo inicia siempre la conversación; el voluntario la acepta al
  responder.

---

## Cómo se trabaja aquí

- Rama `claude/<algo>`, commit, push y PR. El usuario dice cuándo mergear
  (aunque a veces "arréglalo" significa que quiere verlo desplegado: si el
  arreglo ya está hecho y sin mergear, dilo en vez de rehacerlo).
- **Verifica en el navegador, no a ojo.** Hay Chromium en
  `/opt/pw-browsers/chromium` y `playwright-core`. Lo visual se mide: posición
  de cajas, solapamientos, peticiones de red. Varias veces la causa real era lo
  contrario de lo que parecía.
- **Un test que no falla sin el arreglo no prueba nada.** Comprueba siempre que
  el test nuevo falla con el código antiguo.
- `npm test` · `npx tsc --noEmit` · `npx eslint app components lib` ·
  `npm run build`. Los cuatro, antes de subir.
- Las rutas de prueba temporales van fuera antes del commit (y ojo: una carpeta
  con guion bajo, `app/_algo/`, Next no la enruta).
- Commits y PR en español, explicando **por qué**, no solo qué.

---

## Trampas ya encontradas (no volver a pisarlas)

- **`overflow-x: hidden` en `html`/`body` rompe `position: sticky`**: convierte
  el elemento en contenedor de scroll. Se usa `overflow-x: clip`.
- **`upsert(..., { ignoreDuplicates: true })` no devuelve la fila en
  conflicto** (`ON CONFLICT DO NOTHING`). Si el registro ya existía, hace falta
  un `SELECT` de respaldo. Ver `createHashtag` en `app/actions.ts`.
- **`staleTimes.dynamic` vale 0 por defecto en Next 16**: sin configurarlo,
  volver a una pestaña la renderiza entera en el servidor otra vez. Está a 30 s
  en `next.config.mjs`.
- **`<Link>` precarga por defecto**: la barra inferior disparaba cuatro renders
  completos en el servidor por cada carga. Va con `prefetch={false}`.
- **El cliente de navegador de Supabase arrastra el SDK entero** (realtime,
  websockets, storage). Solo se usa en el chat, que sí necesita realtime; el
  resto de auth va por server actions.
- **`useState(props)` ignora las props nuevas**: tras `revalidatePath`, un
  componente de cliente sigue mostrando lo viejo. Se resincroniza en el render
  (patrón en `components/dashboard-matches.tsx` y `app/feed/post-list.tsx`).
- Los helpers de test comparten `spec` con spread: `...spec` va **antes** de
  `responses`, o machaca las respuestas por defecto y deja el test vacío.

---

## Rendimiento

La base de datos no es el cuello de botella (23 perfiles, consultas de ~0,1 ms)
y Vercel y Supabase están los dos en `us-east-1`. Lo que sí pesaba: renders de
más en el servidor y JavaScript de más en el móvil. Si vuelve a ir lento, mide
antes de tocar: cuenta peticiones al servidor y kilobytes de JS con el
navegador, y usa contexto limpio por ruta (si comparten caché, los números
mienten).

Queda pendiente una validación de sesión duplicada por carga: el middleware
llama a `auth.getUser()` (que va por red) y la página la repite. `getClaims()`
la haría en local, pero solo con claves JWT asimétricas; con HS256 heredada
vuelve a la llamada de red.
