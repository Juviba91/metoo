-- Dos cosas que la política de privacidad afirma y el código no hacía.
--
-- 1. LA BAJA DEJABA TODO LIGADO A LA CUENTA BORRADA.
--
--    Desde 20260916 la ficha de quien se da de baja NO se borra: queda como
--    lápida (alias + rol + deleted_at). Eso rompe en silencio todos los
--    `ON DELETE SET NULL` que apuntan a `profiles`, porque la fila nunca
--    desaparece y la clave ajena nunca salta. Consecuencias, comprobadas en la
--    base el 2026-10-08:
--
--      · guia_respuestas.autor_id seguía puesto, y la vista `guias_publicas`
--        (que no filtra bajas) seguía sirviendo el alias en abierto. El
--        comentario de 20261004 decía lo contrario.
--      · reports, feedback y hashtag_suggestions seguían ligados a la
--        lápida, aunque la política dice «sin quedar ligados a ti: se borra
--        quién los hizo y sobre quién».
--
--    Ahora `eliminar_mi_cuenta` los desvincula explícitamente. Las
--    aportaciones a las guías SE QUEDAN (son conocimiento de la comunidad y no
--    una conversación), pero sin firma; si alguien quiere que se borren, lo
--    pide por correo. Un reporte pierde también la conversación a la que
--    apuntaba, porque `connections` sí sigue ligada a la lápida.
--
--    Regla para el futuro: toda tabla nueva con clave ajena a `profiles` tiene
--    que desvincularse aquí. `ON DELETE SET NULL` no sirve mientras la ficha
--    sobreviva.
--
--    Hoy hay 0 bajas, así que el bloque de «lo ya borrado» no toca nada. Se
--    deja por si alguien se da de baja entre que se mergea el código y se
--    aplica esto.
--
-- 2. EL CONSENTIMIENTO NO QUEDABA REGISTRADO.
--
--    El art. 9 RGPD exige consentimiento explícito y el art. 7.1 que se pueda
--    demostrar. Se guarda cuándo y qué versión de los textos (lib/legal.ts).
--    Las cuentas anteriores quedan a NULL: no hay forma de reconstruirlo.
--
-- Solo INSERT para `authenticated`, como el resto de columnas de la ficha: no
-- hay GRANT de UPDATE, así que nadie puede reescribir su propio registro.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consentimiento_en timestamptz,
  ADD COLUMN IF NOT EXISTS consentimiento_version text;

GRANT INSERT (consentimiento_en, consentimiento_version) ON public.profiles TO authenticated;

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

-- Lo ya borrado antes de esta migración, por si lo hubiera.
UPDATE public.guia_respuestas SET autor_id = NULL
 WHERE autor_id IN (SELECT id FROM public.profiles WHERE deleted_at IS NOT NULL);
UPDATE public.reports SET connection_id = NULL
 WHERE reporter_id IN (SELECT id FROM public.profiles WHERE deleted_at IS NOT NULL)
    OR reported_id IN (SELECT id FROM public.profiles WHERE deleted_at IS NOT NULL);
UPDATE public.reports SET reporter_id = NULL
 WHERE reporter_id IN (SELECT id FROM public.profiles WHERE deleted_at IS NOT NULL);
UPDATE public.reports SET reported_id = NULL
 WHERE reported_id IN (SELECT id FROM public.profiles WHERE deleted_at IS NOT NULL);
UPDATE public.feedback SET profile_id = NULL
 WHERE profile_id IN (SELECT id FROM public.profiles WHERE deleted_at IS NOT NULL);
UPDATE public.hashtag_suggestions SET profile_id = NULL
 WHERE profile_id IN (SELECT id FROM public.profiles WHERE deleted_at IS NOT NULL);
