-- Aviso a los voluntarios de que hay gente esperando.
--
-- El problema que ataca: un voluntario se apunta, no recibe ninguna solicitud
-- en semanas y se enfría. Mientras tanto hay gente pidiendo apoyo que no
-- encuentra a nadie. Los dos lados están ahí y no se ven.
--
-- NO es un boletín. Solo sale cuando hay alguien esperando de verdad a quien
-- ese voluntario podría acompañar. Si no hay nadie, no se manda nada.

-- Preferencia propia, separada de los avisos de mensajes y solicitudes: mucha
-- gente quiere saber si le han escrito y no quiere nada más.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS digest_enabled boolean NOT NULL DEFAULT true;

-- Para no repetir el aviso antes de tiempo.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_digest_at timestamptz;

-- Para poder darse de baja desde el propio correo, sin iniciar sesión. Es un
-- valor por usuario, no adivinable.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS digest_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS profiles_digest_token_idx
  ON public.profiles (digest_token);

-- El token no puede viajar al navegador de nadie: se lee solo con la service
-- role, desde la función de correo y desde la página de baja.
REVOKE SELECT (digest_token) ON public.profiles FROM anon, authenticated;

-- Quien puede modificar su propia fila podría escribirse el token de otro y
-- darle de baja en su nombre. Desde el cliente solo se tocan las columnas que
-- la app edita de verdad.
--
-- `role` queda fuera a propósito: se elige en el onboarding (que es un INSERT,
-- no le afecta esto) y la app no lo cambia nunca. Cambiarlo movería a alguien
-- de un lado al otro del emparejamiento.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (alias, city, bio, is_active, stage, support_modes,
              email_notifications_enabled, digest_enabled)
  ON public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- A quién avisar, y de qué
-- ---------------------------------------------------------------------------
-- Devuelve un voluntario solo si hay alguien a quien podría acompañar de
-- verdad. Las condiciones importan tanto como el correo:
--
--   · el voluntario está activo y no se ha dado de baja de este aviso
--   · no se le ha avisado en los últimos `p_dias`
--   · hay al menos un seeker activo con el que NO tiene ya conexión (de
--     cualquier estado: si ya hablaron, o si la rechazó, no es alguien a quien
--     "podría" acompañar)
--   · y con quien no hay bloqueo en ninguno de los dos sentidos
--
-- Las etiquetas que se devuelven son las de esa gente que espera, para poder
-- decir de qué hablan sin decir quiénes son.

CREATE OR REPLACE FUNCTION public.voluntarios_a_avisar(p_dias integer DEFAULT 7)
RETURNS TABLE (volunteer_id uuid, esperando integer, etiquetas text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH voluntarios AS (
    SELECT p.id
      FROM profiles p
     WHERE p.role = 'volunteer'
       AND p.is_active
       AND p.digest_enabled
       AND (p.last_digest_at IS NULL
            OR p.last_digest_at < now() - make_interval(days => p_dias))
  ),
  esperan AS (
    SELECT v.id AS volunteer_id, s.id AS seeker_id
      FROM voluntarios v
      JOIN profiles s
        ON s.role = 'seeker'
       AND s.is_active
     WHERE NOT EXISTS (
             SELECT 1 FROM connections c
              WHERE c.volunteer_id = v.id AND c.seeker_id = s.id
           )
       AND NOT EXISTS (
             SELECT 1 FROM blocks b
              WHERE (b.blocker_id = v.id AND b.blocked_id = s.id)
                 OR (b.blocker_id = s.id AND b.blocked_id = v.id)
           )
  )
  SELECT e.volunteer_id,
         count(DISTINCT e.seeker_id)::int AS esperando,
         coalesce(
           array_agg(DISTINCT h.label) FILTER (WHERE h.label IS NOT NULL),
           '{}'
         ) AS etiquetas
    FROM esperan e
    LEFT JOIN profile_hashtags ph ON ph.profile_id = e.seeker_id
    LEFT JOIN hashtags h ON h.id = ph.hashtag_id
   GROUP BY e.volunteer_id
$$;

-- Solo la invoca la Edge Function con la service role.
REVOKE ALL ON FUNCTION public.voluntarios_a_avisar(integer) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Programación semanal
-- ---------------------------------------------------------------------------
-- Martes a las 10:00 UTC. Ni lunes (bandeja llena) ni fin de semana.
-- La función no manda nada si no hay nadie esperando, así que la mayoría de
-- las semanas esto no hará absolutamente nada, que es lo que se busca.

CREATE OR REPLACE FUNCTION public.disparar_resumen_voluntarios()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_anon text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url    FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_anon   FROM vault.decrypted_secrets WHERE name = 'anon_key';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  IF v_url IS NULL OR v_anon IS NULL OR v_secret IS NULL THEN
    RAISE NOTICE 'disparar_resumen_voluntarios: falta configuracion en Vault';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/send-digest',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || v_anon,
                 'x-cron-secret', v_secret
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.disparar_resumen_voluntarios() FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('resumen-voluntarios')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'resumen-voluntarios');

SELECT cron.schedule('resumen-voluntarios', '0 10 * * 2',
                     'SELECT public.disparar_resumen_voluntarios()');

-- ---------------------------------------------------------------------------
-- Baja desde el propio correo
-- ---------------------------------------------------------------------------
-- La página de baja es pública: quien pulsa el enlace del correo no tiene por
-- qué haber iniciado sesión, y darse de baja no puede exigir recordar la
-- contraseña.
--
-- Se hace con estas dos funciones y no con la service role a propósito. Esa
-- clave lo puede todo, y esta es la única ruta sin sesión que la necesitaría:
-- si algún día hubiera un fallo ahí, el alcance sería el esquema entero. Así
-- lo único que se puede hacer con un token es apagar ESA casilla de ESE
-- perfil.

CREATE OR REPLACE FUNCTION public.resumen_estado(p_token uuid)
RETURNS TABLE (alias text, activo boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.alias, p.digest_enabled
    FROM profiles p
   WHERE p.digest_token = p_token
$$;

CREATE OR REPLACE FUNCTION public.baja_resumen(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_filas int;
BEGIN
  UPDATE profiles
     SET digest_enabled = false
   WHERE digest_token = p_token;

  GET DIAGNOSTICS v_filas = ROW_COUNT;
  RETURN v_filas > 0;
END;
$$;

-- Sin sesión: es justo el caso de uso.
GRANT EXECUTE ON FUNCTION public.resumen_estado(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.baja_resumen(uuid) TO anon, authenticated;
