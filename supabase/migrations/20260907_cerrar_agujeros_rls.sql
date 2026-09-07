-- Tres agujeros encontrados revisando el esquema real contra el catálogo.
-- Ninguno se ve leyendo el código de la app: los tres están en los permisos.

-- ---------------------------------------------------------------------------
-- 1. Un voluntario podía cambiar el `seeker_id` de su conexión
-- ---------------------------------------------------------------------------
-- La política `conn_update` dice USING (auth.uid() = volunteer_id) y no declara
-- WITH CHECK. En Postgres, cuando falta WITH CHECK se reutiliza la expresión de
-- USING, así que lo único que se comprueba de la fila nueva es que el
-- voluntario siga siendo el mismo. El `seeker_id` no lo mira nadie.
--
-- Con eso, un voluntario podía hacer un PATCH a /rest/v1/connections cambiando
-- `seeker_id` por el de otra persona. Los mensajes cuelgan de `connection_id`,
-- y la política de `messages` deja leer los de las conexiones de las que eres
-- parte: el historial entero de quien pidió apoyo pasaba a ser visible para un
-- tercero. En una app donde la gente cuenta un diagnóstico, eso es lo más grave
-- que puede pasar.
--
-- Se arregla por privilegios de columna, no por política: RLS no puede comparar
-- la fila nueva con la vieja, pero un GRANT sí puede decir qué columnas se
-- tocan. La única que la app necesita modificar desde el cliente es `status`
-- (aceptar y rechazar). Las marcas de lectura las escribe
-- `mark_connection_read()`, que es SECURITY DEFINER y no depende de esto.

REVOKE UPDATE ON public.connections FROM authenticated;
GRANT UPDATE (status) ON public.connections TO authenticated;

-- Redundante con lo anterior, pero deja la intención escrita en la política.
ALTER POLICY conn_update ON public.connections
  USING (auth.uid() = volunteer_id)
  WITH CHECK (auth.uid() = volunteer_id);

-- ---------------------------------------------------------------------------
-- 2. El feed entero se podía leer sin tener cuenta
-- ---------------------------------------------------------------------------
-- Estas políticas estaban concedidas al rol `public`, que incluye a `anon`. Con
-- la anon key —que es pública y viaja en el JavaScript del navegador— cualquiera
-- podía leer sin registrarse:
--
--   posts             el texto de todas las publicaciones
--   post_reactions    quién ha reaccionado a qué
--   profile_hashtags  qué etiquetas tiene cada perfil, o sea qué le pasa
--
-- `profiles` sí estaba bien (solo `authenticated`), lo que hace pensar que esto
-- fue un descuido y no una decisión: el resto del esquema es coherente.
--
-- Las etiquetas son lo que más incomoda: relacionan un id de perfil con un tema
-- de salud sin que haga falta ni registrarse.
--
-- `categories`, `hashtags` y `hospitals` se quedan públicas a propósito: son
-- catálogos de etiquetas, sin nada de nadie.

DROP POLICY IF EXISTS posts_public_read ON public.posts;
CREATE POLICY posts_read_autenticados ON public.posts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS post_hashtags_public_read ON public.post_hashtags;
CREATE POLICY post_hashtags_read_autenticados ON public.post_hashtags
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS reactions_public_read ON public.post_reactions;
CREATE POLICY reactions_read_autenticados ON public.post_reactions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS profile_hashtags_public_read ON public.profile_hashtags;
CREATE POLICY profile_hashtags_read_autenticados ON public.profile_hashtags
  FOR SELECT TO authenticated USING (true);

-- La política ya deniega, pero sin el GRANT no hay ni por dónde intentarlo.
REVOKE SELECT ON public.posts            FROM anon;
REVOKE SELECT ON public.post_hashtags    FROM anon;
REVOKE SELECT ON public.post_reactions   FROM anon;
REVOKE SELECT ON public.profile_hashtags FROM anon;

-- ---------------------------------------------------------------------------
-- 3. `get_unread_count` contestaba por cualquiera
-- ---------------------------------------------------------------------------
-- Es SECURITY DEFINER, así que se salta la RLS, recibe el uuid por parámetro y
-- nunca comprobaba que fuera el de quien llama. Está expuesta en
-- /rest/v1/rpc/get_unread_count a cualquiera con sesión, y los ids de perfil se
-- ven en las URLs: bastaba con pedirla con el id de otra persona para saber
-- cuántas conversaciones sin leer tiene.
--
-- No es una fuga de contenido, pero sí una señal de actividad de alguien que
-- probablemente está pasándolo mal, y que no eligió compartirla.
--
-- Se mantiene el parámetro para no tener que tocar las llamadas de la app, pero
-- ahora la consulta no devuelve nada si no coincide con la sesión.

CREATE OR REPLACE FUNCTION public.get_unread_count(user_uuid uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(DISTINCT m.connection_id)::bigint
  FROM messages m
  JOIN connections c ON c.id = m.connection_id
  WHERE
    -- Solo por uno mismo. Sin esto, la función contesta por cualquiera.
    user_uuid = auth.uid()
    AND m.sender_id <> user_uuid
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
       WHERE (b.blocker_id = user_uuid AND b.blocked_id = m.sender_id)
          OR (b.blocker_id = m.sender_id AND b.blocked_id = user_uuid)
    )
    AND (
      (c.seeker_id = user_uuid
        AND (c.seeker_last_read_at IS NULL OR m.created_at > c.seeker_last_read_at))
      OR
      (c.volunteer_id = user_uuid
        AND (c.volunteer_last_read_at IS NULL OR m.created_at > c.volunteer_last_read_at))
    )
$function$;
