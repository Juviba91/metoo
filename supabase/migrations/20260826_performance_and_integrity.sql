-- ---------------------------------------------------------------------------
-- 1. Rendimiento de RLS
-- ---------------------------------------------------------------------------
-- Políticas duplicadas: cada consulta evalúa TODAS las permisivas que apliquen,
-- así que un duplicado exacto es trabajo doble. Se conserva la más amplia.
DROP POLICY IF EXISTS "Authenticated users can insert hashtags" ON public.hashtags;
DROP POLICY IF EXISTS hashtags_read               ON public.hashtags;
DROP POLICY IF EXISTS post_hashtags_insert        ON public.post_hashtags;
DROP POLICY IF EXISTS post_hashtags_read          ON public.post_hashtags;
DROP POLICY IF EXISTS post_reactions_read         ON public.post_reactions;
DROP POLICY IF EXISTS reactions_own_delete        ON public.post_reactions;
DROP POLICY IF EXISTS reactions_own_insert        ON public.post_reactions;
DROP POLICY IF EXISTS posts_delete                ON public.posts;
DROP POLICY IF EXISTS posts_insert                ON public.posts;
DROP POLICY IF EXISTS posts_read                  ON public.posts;
DROP POLICY IF EXISTS profile_hashtags_read       ON public.profile_hashtags;
DROP POLICY IF EXISTS profile_hashtags_own_delete ON public.profile_hashtags;
DROP POLICY IF EXISTS profile_hashtags_own_write  ON public.profile_hashtags;

-- auth.uid() sin envolver se reevalúa POR CADA FILA. Dentro de un subselect,
-- Postgres lo calcula una sola vez (InitPlan). Se aprovecha para acotar a
-- `authenticated` lo que depende de la sesión: con anon auth.uid() es NULL y
-- esas políticas nunca casaban de todos modos.

DROP POLICY IF EXISTS blocks_select_own ON public.blocks;
CREATE POLICY blocks_select_own ON public.blocks
  FOR SELECT TO authenticated USING ((select auth.uid()) = blocker_id);
DROP POLICY IF EXISTS blocks_insert_own ON public.blocks;
CREATE POLICY blocks_insert_own ON public.blocks
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = blocker_id);
DROP POLICY IF EXISTS blocks_delete_own ON public.blocks;
CREATE POLICY blocks_delete_own ON public.blocks
  FOR DELETE TO authenticated USING ((select auth.uid()) = blocker_id);

DROP POLICY IF EXISTS rate_limits_select_own ON public.rate_limits;
CREATE POLICY rate_limits_select_own ON public.rate_limits
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS conn_insert ON public.connections;
CREATE POLICY conn_insert ON public.connections
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = seeker_id);
DROP POLICY IF EXISTS conn_select ON public.connections;
CREATE POLICY conn_select ON public.connections
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = seeker_id OR (select auth.uid()) = volunteer_id);
DROP POLICY IF EXISTS conn_update ON public.connections;
CREATE POLICY conn_update ON public.connections
  FOR UPDATE TO authenticated USING ((select auth.uid()) = volunteer_id);

DROP POLICY IF EXISTS "insertar mensaje propio" ON public.messages;
CREATE POLICY "insertar mensaje propio" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM connections c
       WHERE c.id = messages.connection_id
         AND ((select auth.uid()) IN (c.seeker_id, c.volunteer_id))
    )
  );
DROP POLICY IF EXISTS "ver mensajes de mi conexión" ON public.messages;
CREATE POLICY "ver mensajes de mi conexión" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM connections c
       WHERE c.id = messages.connection_id
         AND ((select auth.uid()) IN (c.seeker_id, c.volunteer_id))
    )
  );

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- La subconsulta contra profiles equivalía a comparar con profile_id, que ya
-- es FK a profiles.
DROP POLICY IF EXISTS pc_select ON public.profile_categories;
CREATE POLICY pc_select ON public.profile_categories
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS pc_insert ON public.profile_categories;
CREATE POLICY pc_insert ON public.profile_categories
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = profile_id);
DROP POLICY IF EXISTS pc_delete ON public.profile_categories;
CREATE POLICY pc_delete ON public.profile_categories
  FOR DELETE TO authenticated USING ((select auth.uid()) = profile_id);

DROP POLICY IF EXISTS posts_own_insert ON public.posts;
CREATE POLICY posts_own_insert ON public.posts
  FOR INSERT TO authenticated WITH CHECK (author_id = (select auth.uid()));
DROP POLICY IF EXISTS posts_own_delete ON public.posts;
CREATE POLICY posts_own_delete ON public.posts
  FOR DELETE TO authenticated USING (author_id = (select auth.uid()));

DROP POLICY IF EXISTS post_hashtags_own_post_insert ON public.post_hashtags;
CREATE POLICY post_hashtags_own_post_insert ON public.post_hashtags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = post_hashtags.post_id
              AND posts.author_id = (select auth.uid()))
  );

-- `FOR ALL` incluía SELECT y solapaba con la lectura pública. Se separan en
-- políticas de escritura. No hace falta UPDATE: la app solo inserta y borra, y
-- la clave primaria es el par completo.
DROP POLICY IF EXISTS post_reactions_own ON public.post_reactions;
CREATE POLICY post_reactions_own_insert ON public.post_reactions
  FOR INSERT TO authenticated WITH CHECK (profile_id = (select auth.uid()));
CREATE POLICY post_reactions_own_delete ON public.post_reactions
  FOR DELETE TO authenticated USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS profile_hashtags_own ON public.profile_hashtags;
CREATE POLICY profile_hashtags_own_insert ON public.profile_hashtags
  FOR INSERT TO authenticated WITH CHECK (profile_id = (select auth.uid()));
CREATE POLICY profile_hashtags_own_delete ON public.profile_hashtags
  FOR DELETE TO authenticated USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;
CREATE POLICY "Users can insert feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (profile_id = (select auth.uid()));
DROP POLICY IF EXISTS "Users can insert suggestions" ON public.hashtag_suggestions;
CREATE POLICY "Users can insert suggestions" ON public.hashtag_suggestions
  FOR INSERT TO authenticated WITH CHECK (profile_id = (select auth.uid()));
DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (reporter_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. Índices que faltaban
-- ---------------------------------------------------------------------------
-- `messages` solo tenía la PK. Es la tabla que más crecerá y la consulta más
-- frecuente ("mensajes de esta conexión, por fecha") hacía un escaneo completo.
CREATE INDEX IF NOT EXISTS messages_connection_created_idx
  ON public.messages (connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages (sender_id);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_author_idx     ON public.posts (author_id);

CREATE INDEX IF NOT EXISTS profiles_role_active_idx ON public.profiles (role, is_active);

CREATE INDEX IF NOT EXISTS post_hashtags_hashtag_idx    ON public.post_hashtags (hashtag_id);
CREATE INDEX IF NOT EXISTS post_reactions_profile_idx   ON public.post_reactions (profile_id);
CREATE INDEX IF NOT EXISTS profile_hashtags_hashtag_idx ON public.profile_hashtags (hashtag_id);

-- Resto de FKs sin índice: sin ellos, borrar un perfil obliga a escanear
-- entera cada tabla hija (el admin borra cuentas desde el panel).
CREATE INDEX IF NOT EXISTS profile_categories_category_idx ON public.profile_categories (category_id);
CREATE INDEX IF NOT EXISTS connections_category_idx        ON public.connections (category_id);
CREATE INDEX IF NOT EXISTS categories_parent_idx           ON public.categories (parent_id);
CREATE INDEX IF NOT EXISTS reports_reported_idx            ON public.reports (reported_id);
CREATE INDEX IF NOT EXISTS reports_reporter_idx            ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS reports_connection_idx          ON public.reports (connection_id);
CREATE INDEX IF NOT EXISTS feedback_profile_idx            ON public.feedback (profile_id);
CREATE INDEX IF NOT EXISTS hashtag_suggestions_profile_idx ON public.hashtag_suggestions (profile_id);

-- Redundante: ya existe un UNIQUE sobre las mismas columnas y en el mismo orden.
DROP INDEX IF EXISTS public.profile_categories_profile_id_category_id_idx;

-- ---------------------------------------------------------------------------
-- 3. Integridad: una sola conexión por par
-- ---------------------------------------------------------------------------
-- Nada impedía crear varias conexiones para el mismo par: dos pestañas, o
-- volver a pulsar "Contactar" tras un rechazo (el dashboard oculta las
-- rechazadas y vuelve a mostrar el botón). Cada duplicado abría otro chat y
-- disparaba otro email.
ALTER TABLE public.connections
  ADD CONSTRAINT connections_unique_pair UNIQUE (seeker_id, volunteer_id);

-- ---------------------------------------------------------------------------
-- 4. Realtime
-- ---------------------------------------------------------------------------
-- chat-view.tsx se suscribe a UPDATE de `connections` para reflejar en vivo
-- cuando el voluntario acepta, pero la tabla no estaba publicada: esa
-- suscripción no recibía nada. Realtime respeta RLS, así que solo lo reciben
-- las dos partes de la conexión.
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
