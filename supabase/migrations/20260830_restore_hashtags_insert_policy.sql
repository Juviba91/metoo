-- 20260826_performance_and_integrity.sql borró "Authenticated users can insert
-- hashtags" junto al resto de políticas duplicadas, pero —a diferencia del
-- resto de tablas de aquella lista— no volvió a crear ninguna de escritura
-- para `hashtags`. Sin una política INSERT, la RLS deniega por defecto:
--   * el picker no puede crear hashtags nuevos (createHashtag)
--   * publicar un post con un hashtag inédito no lo da de alta (createPost)
--
-- Se restaura solo si de verdad no quedó ninguna política INSERT, para no
-- reintroducir el duplicado que aquella migración venía a limpiar.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'hashtags'
       AND cmd IN ('INSERT', 'ALL')
  ) THEN
    CREATE POLICY hashtags_insert_authenticated ON public.hashtags
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- Mismo razonamiento para la lectura: `hashtags_read` también se borró. La
-- lista curada se muestra en el onboarding, en el picker y en los filtros del
-- dashboard, así que sin SELECT la app se queda sin hashtags que ofrecer.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'hashtags'
       AND cmd IN ('SELECT', 'ALL')
  ) THEN
    CREATE POLICY hashtags_select_all ON public.hashtags
      FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- Las otras tablas de aquella lista de DROPs perdieron su política de lectura
-- por el mismo motivo. Si alguna se quedó sin SELECT, el feed aparece vacío o
-- sin hashtags/reacciones aunque los datos estén ahí.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['posts', 'post_hashtags', 'post_reactions', 'profile_hashtags']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename  = t
         AND cmd IN ('SELECT', 'ALL')
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
        t || '_select_all', t
      );
    END IF;
  END LOOP;
END $$;
