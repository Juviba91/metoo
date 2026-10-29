-- Avisos push en el móvil (app instalable).
--
-- Hasta ahora los avisos de mensajes y solicitudes solo llegaban por correo, y
-- en un chat eso va lento. Cada dispositivo en el que alguien activa los
-- avisos guarda aquí su suscripción (la da el navegador: una URL del servicio
-- de push y dos claves). La app la usa para avisar de mensajes y solicitudes,
-- sin el contenido de los mensajes. Se borra al desactivar los avisos, cuando
-- el servicio de push dice que ya no existe, o al darse de baja.
--
-- `push_suscripciones` cuelga de `profiles`: `eliminar_mi_cuenta` la borra a
-- mano (la baja deja la ficha como lápida). Se redefine entera, igual que la
-- de 20261026 más esa línea.

CREATE TABLE IF NOT EXISTS public.push_suscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (endpoint LIKE 'https://%' AND char_length(endpoint) < 1000),
  p256dh text NOT NULL CHECK (char_length(p256dh) < 200),
  auth text NOT NULL CHECK (char_length(auth) < 100),
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_suscripciones_profile_idx ON public.push_suscripciones (profile_id);

ALTER TABLE public.push_suscripciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_propias_select ON public.push_suscripciones;
CREATE POLICY push_propias_select ON public.push_suscripciones
  FOR SELECT TO authenticated USING (profile_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS push_propias_insert ON public.push_suscripciones;
CREATE POLICY push_propias_insert ON public.push_suscripciones
  FOR INSERT TO authenticated WITH CHECK (profile_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS push_propias_delete ON public.push_suscripciones;
CREATE POLICY push_propias_delete ON public.push_suscripciones
  FOR DELETE TO authenticated USING (profile_id = (SELECT auth.uid()));

REVOKE ALL ON public.push_suscripciones FROM anon, authenticated;
GRANT SELECT, DELETE ON public.push_suscripciones TO authenticated;
GRANT INSERT (profile_id, endpoint, p256dh, auth) ON public.push_suscripciones TO authenticated;

-- ─── la baja borra también las suscripciones ──────────────────────────────

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

