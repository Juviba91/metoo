-- Papel por tema, 2ª parte: las dos funciones de la base que aún miraban
-- `profiles.role` para decidir quién acompaña y quién busca.
--
-- Desde 20261012 el papel va por tema (`profile_hashtags.role`), y una cuenta
-- puede estar a los dos lados. La regla es la de lib/lados.ts (`ladosDe`):
-- acompaña quien se registró como voluntario O tiene algún tema «lo viví»;
-- busca quien se registró buscando apoyo O tiene algún tema «lo estoy
-- viviendo». Aquí se copia tal cual para que la base y la app no discrepen.
--
-- 1. `voluntarios_a_avisar` (resumen semanal): una cuenta registrada buscando
--    apoyo que marcó «lo viví» en un tema no recibía nunca el resumen, y una
--    voluntaria que está viviendo algo no salía como alguien que espera. Las
--    etiquetas del resumen son ahora solo los temas en los que esa persona
--    busca apoyo, no todos los suyos. Y la conexión se busca en los dos
--    sentidos: si ya habláis, da igual quién escribió a quién.
--
-- 2. `temas_con_actividad` (pantalla Temas): «personas» y «compañeros» se
--    contaban con el papel de la cuenta. Ahora con el papel en ESE tema: el
--    tuyo si lo tienes en el perfil, y si no, el de tu cuenta.
--
-- Mismas firmas que antes: `CREATE OR REPLACE` y nada que cambiar en las
-- funciones de Supabase (send-digest) ni en la app.

CREATE OR REPLACE FUNCTION public.voluntarios_a_avisar(p_dias integer DEFAULT 7)
RETURNS TABLE(volunteer_id uuid, esperando integer, etiquetas text[])
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
WITH voluntarios AS (
  SELECT p.id FROM profiles p
   WHERE p.is_active AND p.digest_enabled AND p.deleted_at IS NULL
     AND (p.role = 'volunteer'
          OR EXISTS (SELECT 1 FROM profile_hashtags x
                      WHERE x.profile_id = p.id AND x.role = 'volunteer'))
     AND (p.last_digest_at IS NULL
          OR p.last_digest_at < now() - make_interval(days => p_dias))
),
buscan AS (
  SELECT s.id FROM profiles s
   WHERE s.is_active AND s.deleted_at IS NULL
     AND (s.role = 'seeker'
          OR EXISTS (SELECT 1 FROM profile_hashtags x
                      WHERE x.profile_id = s.id AND x.role = 'seeker'))
),
esperan AS (
  SELECT v.id AS volunteer_id, s.id AS seeker_id
    FROM voluntarios v
    JOIN buscan s ON s.id <> v.id
   WHERE NOT EXISTS (SELECT 1 FROM connections c
                      WHERE (c.volunteer_id = v.id AND c.seeker_id = s.id)
                         OR (c.volunteer_id = s.id AND c.seeker_id = v.id))
     AND NOT EXISTS (SELECT 1 FROM blocks b
                      WHERE (b.blocker_id = v.id AND b.blocked_id = s.id)
                         OR (b.blocker_id = s.id AND b.blocked_id = v.id))
)
SELECT e.volunteer_id,
       count(DISTINCT e.seeker_id)::int,
       coalesce(array_agg(DISTINCT h.label) FILTER (WHERE h.label IS NOT NULL), '{}')
  FROM esperan e
  LEFT JOIN profile_hashtags ph ON ph.profile_id = e.seeker_id AND ph.role = 'seeker'
  LEFT JOIN hashtags h ON h.id = ph.hashtag_id
 GROUP BY e.volunteer_id
$$;

CREATE OR REPLACE FUNCTION public.temas_con_actividad()
RETURNS TABLE(id uuid, slug text, label text, personas integer, companeros integer, publicaciones integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH yo AS (
    SELECT p.id, p.role FROM profiles p WHERE p.id = (select auth.uid())
  ),
  ocultos AS (
    SELECT b.blocked_id AS id FROM blocks b WHERE b.blocker_id = (select auth.uid())
    UNION
    SELECT b.blocker_id FROM blocks b WHERE b.blocked_id = (select auth.uid())
  ),
  visibles AS (
    SELECT ph.hashtag_id, ph.role
      FROM profile_hashtags ph
      JOIN profiles p ON p.id = ph.profile_id
     WHERE p.is_active
       AND p.deleted_at IS NULL
       AND p.id <> (select auth.uid())
       AND p.id NOT IN (SELECT id FROM ocultos)
  ),
  -- Mi lado en cada tema: el de mi perfil si lo tengo, el de la cuenta si no.
  mi_lado AS (
    SELECT h.id AS hashtag_id,
           coalesce((SELECT ph.role FROM profile_hashtags ph, yo
                      WHERE ph.profile_id = yo.id AND ph.hashtag_id = h.id),
                    (SELECT role FROM yo)) AS role
      FROM hashtags h
  )
  SELECT h.id,
         h.slug,
         h.label,
         (SELECT count(*)::int FROM visibles v, mi_lado m
           WHERE v.hashtag_id = h.id AND m.hashtag_id = h.id AND v.role <> m.role),
         (SELECT count(*)::int FROM visibles v, mi_lado m
           WHERE v.hashtag_id = h.id AND m.hashtag_id = h.id AND v.role = m.role),
         (SELECT count(*)::int
            FROM post_hashtags pph
            JOIN posts po ON po.id = pph.post_id
           WHERE pph.hashtag_id = h.id
             AND po.author_id NOT IN (SELECT id FROM ocultos))
    FROM hashtags h
   WHERE EXISTS (SELECT 1 FROM yo)
   ORDER BY 4 DESC, 5 DESC, 6 DESC, h.label
$$;
