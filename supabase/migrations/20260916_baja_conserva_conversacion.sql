-- Al borrarse una cuenta, la conversación ya no desaparece del otro lado.
--
-- Antes: `connections.seeker_id`/`volunteer_id` y `messages.sender_id` cuelgan
-- de `profiles` con ON DELETE CASCADE, y `profiles.id` colgaba de `auth.users`
-- igual. Borrar la cuenta se llevaba por delante la conexión y TODOS los
-- mensajes, los suyos y los de la otra persona. Al otro lado el chat se
-- esfumaba sin más: no sabías si te habían bloqueado, si era un fallo, o qué.
-- En una app donde la gente está en mitad de un diagnóstico o un duelo, eso no
-- es un detalle de interfaz.
--
-- Ahora la ficha se queda como lápida: conserva `id`, `alias` y `role`, y se
-- marca con `deleted_at`. Como todas las claves ajenas apuntan a `profiles` y
-- la fila sigue ahí, las conexiones y los mensajes sobreviven solos, sin tocar
-- ni una clave ajena más. Lo que sí se borra es todo lo que no es de nadie
-- más: publicaciones, reacciones, etiquetas, bloqueos y el acceso.
--
-- OJO, esto es una decisión de producto tomada a conciencia y tiene cara B: lo
-- que esa persona escribió sigue siendo legible para quien hablaba con ella, y
-- con su alias. Por eso se dice ANTES de borrar, en el propio botón y en la
-- política de privacidad, y no después.
--
-- Esto es SOLO para quien se da de baja él mismo. La expulsión desde el panel
-- de administración (`deleteUserAccount`) sigue borrándolo todo: si a alguien
-- se le echa por acosar, lo último que quiere la otra parte es conservar sus
-- mensajes.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- La ficha tiene que sobrevivir a la cuenta de acceso, así que deja de colgar
-- de ella. Los uuid no se reciclan: nadie va a heredar una lápida.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

CREATE OR REPLACE FUNCTION public.eliminar_mi_cuenta()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Lo que es solo suyo se va entero. Las publicaciones arrastran sus
  -- reacciones y sus etiquetas por sus propias claves ajenas.
  DELETE FROM posts WHERE author_id = v_uid;
  DELETE FROM post_reactions WHERE profile_id = v_uid;
  DELETE FROM profile_hashtags WHERE profile_id = v_uid;
  DELETE FROM blocks WHERE blocker_id = v_uid OR blocked_id = v_uid;
  DELETE FROM rate_limits WHERE user_id = v_uid;
  DELETE FROM digest_tokens WHERE profile_id = v_uid;

  -- Queda el alias y el rol, que es lo que la otra persona necesita para
  -- reconocer con quién hablaba. Todo lo demás se vacía: la bio y la ciudad
  -- son texto libre suyo y no hacen falta para sostener la conversación.
  UPDATE profiles SET
    deleted_at = now(),
    is_active = false,
    digest_enabled = false,
    email_notifications_enabled = false,
    bio = NULL,
    city = NULL,
    stage = NULL,
    support_modes = '{}'
  WHERE id = v_uid;

  -- El acceso sí se va: sin esto podría volver a entrar.
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

-- Una solicitud de alguien que ya no está no se puede aceptar ni rechazar: el
-- globo se quedaría puesto para siempre sin forma de quitarlo, que es
-- exactamente el fallo que se arregló hace dos semanas. La conversación se
-- sigue viendo; lo que se quita es el número.
--
-- Los mensajes sin leer NO se tocan a propósito: si alguien te escribió y
-- luego se dio de baja, ese mensaje sigue ahí y sigue siendo para ti. Quitarlo
-- del contador sería no avisarte de algo que puedes leer, y leerlo limpia el
-- aviso como siempre.
CREATE OR REPLACE FUNCTION public.get_pending_count()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT count(*)::int FROM connections c
    JOIN profiles s ON s.id = c.seeker_id
   WHERE c.volunteer_id = (select auth.uid())
     AND c.status = 'pending'
     AND s.deleted_at IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM blocks b
        WHERE (b.blocker_id = (select auth.uid()) AND b.blocked_id = c.seeker_id)
           OR (b.blocker_id = c.seeker_id AND b.blocked_id = (select auth.uid())))
$$;

-- Y que el aviso semanal no cuente como "gente esperando" a quien ya se fue.
-- Se conserva el cuerpo tal cual estaba; lo único añadido son los dos
-- `deleted_at IS NULL`.
CREATE OR REPLACE FUNCTION public.voluntarios_a_avisar(p_dias integer DEFAULT 7)
RETURNS TABLE(volunteer_id uuid, esperando integer, etiquetas text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
WITH voluntarios AS (
  SELECT p.id FROM profiles p
   WHERE p.role = 'volunteer' AND p.is_active AND p.digest_enabled
     AND p.deleted_at IS NULL
     AND (p.last_digest_at IS NULL
          OR p.last_digest_at < now() - make_interval(days => p_dias))
),
esperan AS (
  SELECT v.id AS volunteer_id, s.id AS seeker_id
    FROM voluntarios v
    JOIN profiles s ON s.role = 'seeker' AND s.is_active AND s.deleted_at IS NULL
   WHERE NOT EXISTS (SELECT 1 FROM connections c
                      WHERE c.volunteer_id = v.id AND c.seeker_id = s.id)
     AND NOT EXISTS (SELECT 1 FROM blocks b
                      WHERE (b.blocker_id = v.id AND b.blocked_id = s.id)
                         OR (b.blocker_id = s.id AND b.blocked_id = v.id))
)
SELECT e.volunteer_id,
       count(DISTINCT e.seeker_id)::int,
       coalesce(array_agg(DISTINCT h.label) FILTER (WHERE h.label IS NOT NULL), '{}')
  FROM esperan e
  LEFT JOIN profile_hashtags ph ON ph.profile_id = e.seeker_id
  LEFT JOIN hashtags h ON h.id = ph.hashtag_id
 GROUP BY e.volunteer_id
$$;
