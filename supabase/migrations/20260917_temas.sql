-- Pantalla de temas: cuánta vida hay detrás de cada etiqueta.
--
-- No son grupos. Un grupo necesita gente para no ser una sala vacía, y una
-- sala vacía en la que entras se parece demasiado a un rechazo. Esto es otra
-- cosa: la etiqueta ya existe y ya filtra (`/feed?tag=` y la búsqueda del
-- inicio), lo único que faltaba era poder ver de un vistazo dónde hay alguien.
--
-- Devuelve tres números por tema y cada uno responde a una pregunta distinta:
--
--   personas      → del rol contrario. Con quién PUEDES hablar. Es el número
--                   que de verdad importa.
--   companeros    → de tu mismo rol, sin contarte. No puedes escribirles (el
--                   modelo es seeker → voluntario y no se toca), pero saber que
--                   hay otras tres personas que vivieron lo mismo no es poca
--                   cosa cuando acabas de llegar.
--   publicaciones → del feed, ya filtrables por esa etiqueta.
--
-- Los dos primeros existen por separado a propósito. Con una sola cifra, un
-- voluntario en una app sin seekers ve 28 ceros y se va; y una cifra que los
-- mezclara le haría creer que tiene a alguien esperando cuando no lo tiene.
--
-- Va por función y no por consulta directa porque hay que descontar a los
-- bloqueados en ambos sentidos, y eso no se puede expresar desde PostgREST sin
-- exponer por RLS quién ha bloqueado a quién.
--
-- Solo salen cifras: ni alias, ni ciudades, ni enlaces a nadie. El anonimato
-- se sostiene igual que en el resto de la app.

CREATE OR REPLACE FUNCTION public.temas_con_actividad()
RETURNS TABLE (
  id uuid,
  slug text,
  label text,
  personas integer,
  companeros integer,
  publicaciones integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH yo AS (
    SELECT p.role FROM profiles p WHERE p.id = (select auth.uid())
  ),
  ocultos AS (
    SELECT b.blocked_id AS id FROM blocks b WHERE b.blocker_id = (select auth.uid())
    UNION
    SELECT b.blocker_id FROM blocks b WHERE b.blocked_id = (select auth.uid())
  ),
  visibles AS (
    SELECT ph.hashtag_id, p.role
      FROM profile_hashtags ph
      JOIN profiles p ON p.id = ph.profile_id
     WHERE p.is_active
       AND p.deleted_at IS NULL
       AND p.id <> (select auth.uid())
       AND p.id NOT IN (SELECT id FROM ocultos)
  )
  SELECT h.id,
         h.slug,
         h.label,
         (SELECT count(*)::int FROM visibles v
           WHERE v.hashtag_id = h.id AND v.role <> (SELECT role FROM yo)),
         (SELECT count(*)::int FROM visibles v
           WHERE v.hashtag_id = h.id AND v.role = (SELECT role FROM yo)),
         (SELECT count(*)::int
            FROM post_hashtags pph
            JOIN posts po ON po.id = pph.post_id
           WHERE pph.hashtag_id = h.id
             AND po.author_id NOT IN (SELECT id FROM ocultos))
    FROM hashtags h
   WHERE EXISTS (SELECT 1 FROM yo)
   ORDER BY 4 DESC, 5 DESC, 6 DESC, h.label
$$;

REVOKE ALL ON FUNCTION public.temas_con_actividad() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.temas_con_actividad() TO authenticated;
