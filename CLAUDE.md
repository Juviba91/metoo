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

**La migración se aplica ANTES de mergear, no después.** No basta con avisarlo
en el cuerpo del PR: hay que ver la columna en la base antes de tocar el botón.
Esta regla ya estaba escrita aquí y se saltó igual, así que lo importante es
reconocer el síntoma.

**No parece un error de base de datos.** Si el código pide una columna que aún
no existe, PostgREST rechaza la consulta ENTERA y devuelve `data: null`. Y
`null` es lo mismo que devuelve un usuario sin perfil, así que la app hace lo
que hace siempre en ese caso: `redirect('/onboarding')`. El usuario ve "crea tu
perfil" en vez de un fallo, y parece que se han perdido los datos.

Pasó exactamente así con `digest_enabled`: PR mergeado, SQL sin pegar, y el
dueño de la app sin poder entrar en su propio perfil.

Corolario: **un `select('*')` es una bomba de relojería** con permisos por
columna. Si se revoca la lectura de una sola columna, `*` tumba la consulta
entera. Pide las columnas que uses.

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
- **En rutas dinámicas, el prefetch por defecto de `<Link>` solo trae el
  esqueleto del `loading.tsx`, no el contenido.** Por eso al medirlo parecía
  inútil y se puso `prefetch={false}` — medición correcta, conclusión
  incompleta. Hay que poner `prefetch` (o `prefetch={true}`) explícito. Medido a
  140 ms de latencia, con datos que tardan 250 ms: `false` 376 ms, por defecto
  370 ms, explícito **95 ms**. Las cuatro pestañas lo llevan.
- **El cliente de navegador de Supabase arrastra el SDK entero** (realtime,
  websockets, storage). Solo se usa en el chat, que sí necesita realtime; el
  resto de auth va por server actions.
- **`useState(props)` ignora las props nuevas**: tras `revalidatePath`, un
  componente de cliente sigue mostrando lo viejo. Se resincroniza en el render
  (patrón en `components/dashboard-matches.tsx` y `app/feed/post-list.tsx`).
- Los helpers de test comparten `spec` con spread: `...spec` va **antes** de
  `responses`, o machaca las respuestas por defecto y deja el test vacío.
- **`REVOKE SELECT (columna)` no hace nada si el rol tiene `SELECT` sobre la
  tabla entera.** Revocar a nivel de columna solo cancela concesiones de
  columna. Se creyó protegido así el token de baja y cualquiera con sesión
  podía leerlo. Comprobar siempre con
  `has_column_privilege('authenticated','public.tabla','col','SELECT')`, no dar
  por hecho que el REVOKE surtió efecto. Lo que sí funciona para un dato
  sensible: tabla aparte con RLS y sin políticas, como `email_queue` o
  `digest_tokens`.
- **`supabase/functions/_shared/email.ts` lo importan los tests de Node**
  (`tests/pure.test.ts` usa `escapeHtml`). `tsconfig` excluye
  `supabase/functions`, pero eso no vale para un fichero que alguien importa:
  se comprueba igual. Nada de `Deno.env.get` en el nivel superior de ese
  fichero — revienta `tsc` y la suite entera al importar. Se lee al usarlo, a
  través de `globalThis`.

---

## Rendimiento

La base de datos no es el cuello de botella (un puñado de perfiles, consultas
de ~0,1 ms). Lo que pesa es la geografía y la forma de las peticiones. Mide
antes de tocar, y con contexto limpio por ruta (si comparten caché, los números
mienten).

**Cuidado al emular latencia con Chrome: no la aplica a `localhost`.** Una
medición dio lo mismo con 0 ms que con 60 ms. Hay que servir por la IP de red y
comprobar el emulador aparte (2000 ms declarados deben dar ~8 s de carga).

Lo confirmado en los logs de producción: cada navegación son **dos invocaciones
serverless**, `serverless-middleware` y luego `serverless`, que arrancan en frío
por separado y validan la sesión contra Supabase por red cada una.

Queda pendiente quitar esa validación duplicada: `getClaims()` la haría en
local, pero solo con claves JWT asimétricas; con HS256 heredada vuelve a la
llamada de red. Es un botón en Supabase → Settings → JWT Keys.

Lo estructural que no tiene arreglo en código: plan hobby, región única en
Virginia, usuarios en España.
