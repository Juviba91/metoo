-- Chat del equipo: una conversación entre metoo (Juan, desde el panel de admin)
-- y cada persona, para dar la bienvenida y orientar a quién puede hablar con quién.
--
-- Aparte de `connections`/`messages` a propósito: aquellas son entre dos
-- personas (quien busca y quien acompaña) y siguen la regla «quien busca apoyo
-- escribe primero». Esto es otra cosa: el equipo escribe a quien sea. Un hilo
-- por persona (`usuario_id`); `del_equipo` dice de qué lado viene cada mensaje.
--
-- Solo lo escribe la persona en lo suyo (RLS) o el equipo con la clave de
-- servicio (el panel de admin). Nadie más lo lee.

CREATE TABLE IF NOT EXISTS public.mensajes_equipo (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  del_equipo boolean NOT NULL,
  contenido text NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 2000),
  creado_en timestamptz NOT NULL DEFAULT now(),
  -- Cuándo lo leyó el destinatario: la persona si `del_equipo`, el equipo si no.
  leido_en timestamptz
);

CREATE INDEX IF NOT EXISTS mensajes_equipo_hilo ON public.mensajes_equipo (usuario_id, creado_en);

ALTER TABLE public.mensajes_equipo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mensajes_equipo_propios_select ON public.mensajes_equipo;
CREATE POLICY mensajes_equipo_propios_select ON public.mensajes_equipo
  FOR SELECT TO authenticated USING (usuario_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS mensajes_equipo_propios_insert ON public.mensajes_equipo;
CREATE POLICY mensajes_equipo_propios_insert ON public.mensajes_equipo
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = (SELECT auth.uid()) AND del_equipo = false);

REVOKE ALL ON public.mensajes_equipo FROM anon, authenticated;
GRANT SELECT ON public.mensajes_equipo TO authenticated;
GRANT INSERT (usuario_id, del_equipo, contenido) ON public.mensajes_equipo TO authenticated;

-- ─── freno al spam y avisos por correo ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mensajes_equipo_antes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT NEW.del_equipo AND (
    SELECT count(*) FROM mensajes_equipo e
     WHERE e.usuario_id = NEW.usuario_id AND NOT e.del_equipo
       AND e.creado_en > now() - interval '1 hour'
  ) >= 20 THEN
    RAISE EXCEPTION 'Demasiados mensajes seguidos. Prueba dentro de un rato.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.mensajes_equipo_antes() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS mensajes_equipo_freno ON public.mensajes_equipo;
CREATE TRIGGER mensajes_equipo_freno
  BEFORE INSERT ON public.mensajes_equipo
  FOR EACH ROW EXECUTE FUNCTION public.mensajes_equipo_antes();

-- El aviso no lleva lo escrito (se ve en la pantalla de bloqueo) y se junta: si
-- ya hubo otro mensaje en el mismo sentido hace menos de 10 minutos, no se
-- manda otro correo.
CREATE OR REPLACE FUNCTION public.avisar_mensaje_equipo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_destino text;
BEGIN
  IF EXISTS (
    SELECT 1 FROM mensajes_equipo e
     WHERE e.usuario_id = NEW.usuario_id AND e.del_equipo = NEW.del_equipo
       AND e.id < NEW.id AND e.creado_en > now() - interval '10 minutes'
  ) THEN
    RETURN NULL;
  END IF;

  IF NEW.del_equipo THEN
    PERFORM encolar_correo(
      NEW.usuario_id,
      'Tienes un mensaje del equipo de metoo',
      '<p>Hola,</p>'
        || '<p>El equipo de metoo te ha escrito. Lo tienes en la pestaña Chats.</p>'
        || '<p><a href="https://www.metoonetwork.xyz/dashboard/equipo">Leerlo →</a></p>'
        || '<p style="color:#888;font-size:12px">Puedes desactivar estos correos en Ajustes.</p>',
      true
    );
  ELSE
    SELECT decrypted_secret INTO v_destino FROM vault.decrypted_secrets WHERE name = 'moderacion_email';
    PERFORM encolar_correo_a(
      coalesce(v_destino, 'juan@bay-apps.com'),
      'Te ha escrito alguien en metoo',
      '<p>Una persona ha escrito al equipo.</p>'
        || '<p><a href="https://www.metoonetwork.xyz/admin/mensajes/' || NEW.usuario_id || '">Abrir la conversación →</a></p>'
    );
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.avisar_mensaje_equipo() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS mensajes_equipo_avisar ON public.mensajes_equipo;
CREATE TRIGGER mensajes_equipo_avisar
  AFTER INSERT ON public.mensajes_equipo
  FOR EACH ROW EXECUTE FUNCTION public.avisar_mensaje_equipo();

-- ─── la persona marca como leído lo que le escribió el equipo ─────────────

CREATE OR REPLACE FUNCTION public.marcar_equipo_leido()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE mensajes_equipo SET leido_en = now()
   WHERE usuario_id = auth.uid() AND del_equipo AND leido_en IS NULL;
$$;

REVOKE ALL ON FUNCTION public.marcar_equipo_leido() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_equipo_leido() TO authenticated;

-- ─── el globo de «sin leer» cuenta también el chat del equipo ─────────────
-- Misma función de siempre (20260908) más un punto si el equipo te ha escrito.

CREATE OR REPLACE FUNCTION public.get_unread_count(user_uuid uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT COUNT(DISTINCT m.connection_id)
       FROM messages m
       JOIN connections c ON c.id = m.connection_id
      WHERE
        -- Solo por uno mismo. Sin esto, la función contesta por cualquiera.
        user_uuid = auth.uid()
        -- Lo que no se puede contestar no está "sin leer".
        AND c.status <> 'rejected'
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
        ))::bigint
    + (CASE WHEN user_uuid = auth.uid() AND EXISTS (
         SELECT 1 FROM mensajes_equipo e
          WHERE e.usuario_id = user_uuid AND e.del_equipo AND e.leido_en IS NULL
       ) THEN 1 ELSE 0 END)::bigint
$function$;

-- ─── la baja se lleva el chat del equipo ──────────────────────────────────
-- La ficha se conserva como lápida, así que el ON DELETE CASCADE no salta:
-- hay que borrarlo a mano (tests/baja-datos.test.ts lo vigila).

CREATE OR REPLACE FUNCTION public.eliminar_mi_cuenta()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  DELETE FROM avisos_tema WHERE profile_id = v_uid;
  DELETE FROM push_suscripciones WHERE profile_id = v_uid;
  DELETE FROM mensajes_equipo WHERE usuario_id = v_uid;

  -- Lo que se queda pero deja de ser suyo. La ficha sobrevive, así que estas
  -- claves ajenas no se anulan solas: hay que hacerlo a mano.
  UPDATE guia_respuestas SET autor_id = NULL WHERE autor_id = v_uid;
  -- Antes que los ids: la conversación a la que apunta un reporte lleva a la
  -- lápida por `connections`, y es justo lo que se quiere cortar.
  UPDATE reports SET connection_id = NULL
   WHERE reporter_id = v_uid OR reported_id = v_uid;
  UPDATE reports SET reporter_id = NULL WHERE reporter_id = v_uid;
  UPDATE reports SET reported_id = NULL WHERE reported_id = v_uid;
  UPDATE feedback SET profile_id = NULL WHERE profile_id = v_uid;
  UPDATE hashtag_suggestions SET profile_id = NULL WHERE profile_id = v_uid;

  -- Queda el alias y el rol, que es lo que la otra persona necesita para
  -- reconocer con quién hablaba. Todo lo demás se vacía.
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
