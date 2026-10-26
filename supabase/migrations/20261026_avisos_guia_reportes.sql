-- Tres cosas para que la primera conversación ocurra, y ocurra con cuidado.
--
-- 1. «AVÍSAME CUANDO HAYA ALGUIEN» (`avisos_tema`).
--    Con pocos voluntarios, el tema de quien llega suele estar vacío: veía una
--    lista sin nadie de lo suyo y se iba. Ahora puede pedir que le avisen. En
--    cuanto alguien marca ese tema como «lo viví» (alta o cambio en
--    `profile_hashtags`), se le encola un correo y se anota `avisado_en`, para
--    no avisar dos veces por el mismo tema. Respeta «avisos por correo» de
--    Ajustes y los bloqueos.
--
-- 2. GUÍA PARA QUIEN ACOMPAÑA (`profiles.guia_voluntario_leida_en`).
--    La nota legal (I-6) pide poder acreditar una formación mínima de los
--    voluntarios. Cinco claves en una pantalla y un «lo he leído» que queda
--    anotado con fecha. Se marca solo por la función: no hay GRANT de UPDATE
--    sobre la columna.
--
-- 3. ACUSE DE LOS REPORTES (DSA, art. 16).
--    Quien reporta recibe un correo de «lo hemos recibido», y otro cuando se
--    revisa (`resolved` pasa a true). Sin contar a quién se reportó ni qué se
--    decidió en detalle: el correo se ve en la pantalla de bloqueo.
--
-- Los correos van por `email_queue`, la cola que ya vacía `drain_email_queue`
-- cada 5 minutos: no hace falta desplegar ninguna función nueva. El remitente
-- sale del secreto `from_email` de Vault si existe; si no, el de la cola.
--
-- `avisos_tema` cuelga de `profiles`, así que `eliminar_mi_cuenta` la borra a
-- mano (la baja deja la ficha como lápida y el ON DELETE no salta). Se
-- redefine entera, igual que la de 20261009 más esa línea.

-- ─── utilidad: encolar un correo para una cuenta ──────────────────────────

CREATE OR REPLACE FUNCTION public.encolar_correo(
  p_user uuid,
  p_asunto text,
  p_html text,
  p_respetar_preferencia boolean DEFAULT true
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_from text;
BEGIN
  SELECT u.email INTO v_email
    FROM auth.users u
    JOIN profiles p ON p.id = u.id
   WHERE u.id = p_user
     AND p.deleted_at IS NULL
     AND (NOT p_respetar_preferencia OR coalesce(p.email_notifications_enabled, true));

  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT decrypted_secret INTO v_from FROM vault.decrypted_secrets WHERE name = 'from_email';

  IF v_from IS NULL THEN
    INSERT INTO email_queue (recipient_email, subject, html_body)
    VALUES (v_email, p_asunto, p_html);
  ELSE
    INSERT INTO email_queue (recipient_email, subject, html_body, from_email)
    VALUES (v_email, p_asunto, p_html, v_from);
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.encolar_correo(uuid, text, text, boolean) FROM PUBLIC, anon, authenticated;

-- ─── 1. avisos por tema ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.avisos_tema (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  creado_en timestamptz NOT NULL DEFAULT now(),
  avisado_en timestamptz,
  PRIMARY KEY (profile_id, hashtag_id)
);

ALTER TABLE public.avisos_tema ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avisos_tema_propios_select ON public.avisos_tema;
CREATE POLICY avisos_tema_propios_select ON public.avisos_tema
  FOR SELECT TO authenticated USING (profile_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS avisos_tema_propios_insert ON public.avisos_tema;
CREATE POLICY avisos_tema_propios_insert ON public.avisos_tema
  FOR INSERT TO authenticated WITH CHECK (profile_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS avisos_tema_propios_delete ON public.avisos_tema;
CREATE POLICY avisos_tema_propios_delete ON public.avisos_tema
  FOR DELETE TO authenticated USING (profile_id = (SELECT auth.uid()));

REVOKE ALL ON public.avisos_tema FROM anon, authenticated;
GRANT SELECT, DELETE ON public.avisos_tema TO authenticated;
GRANT INSERT (profile_id, hashtag_id) ON public.avisos_tema TO authenticated;

CREATE OR REPLACE FUNCTION public.avisar_tema_con_voluntario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_aviso record;
  v_tema record;
BEGIN
  IF NEW.role IS DISTINCT FROM 'volunteer' THEN
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.role = 'volunteer' THEN
    RETURN NULL;
  END IF;

  -- Solo si quien acompaña está disponible: si no, no hay a quién escribir.
  IF NOT EXISTS (SELECT 1 FROM profiles
                  WHERE id = NEW.profile_id AND is_active AND deleted_at IS NULL) THEN
    RETURN NULL;
  END IF;

  SELECT slug, label INTO v_tema FROM hashtags WHERE id = NEW.hashtag_id;

  FOR v_aviso IN
    SELECT a.profile_id
      FROM avisos_tema a
     WHERE a.hashtag_id = NEW.hashtag_id
       AND a.avisado_en IS NULL
       AND a.profile_id <> NEW.profile_id
       AND NOT EXISTS (SELECT 1 FROM blocks b
                        WHERE (b.blocker_id = a.profile_id AND b.blocked_id = NEW.profile_id)
                           OR (b.blocker_id = NEW.profile_id AND b.blocked_id = a.profile_id))
  LOOP
    PERFORM encolar_correo(
      v_aviso.profile_id,
      'Ya hay alguien en #' || v_tema.label,
      '<p>Hola,</p>'
        || '<p>Nos pediste que te avisáramos: ya hay alguien en metoo que vivió <strong>#'
        || replace(replace(v_tema.label, '<', '&lt;'), '>', '&gt;')
        || '</strong> y puede acompañarte.</p>'
        || '<p><a href="https://www.metoonetwork.xyz/dashboard?tema=' || v_tema.slug
        || '">Ver quién es →</a></p>'
        || '<p style="color:#888;font-size:12px">Te escribimos porque lo pediste en metoo. '
        || 'Puedes desactivar los avisos por correo en Ajustes.</p>'
    );

    UPDATE avisos_tema SET avisado_en = now()
     WHERE profile_id = v_aviso.profile_id AND hashtag_id = NEW.hashtag_id;
  END LOOP;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.avisar_tema_con_voluntario() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profile_hashtags_avisar_tema ON public.profile_hashtags;
CREATE TRIGGER profile_hashtags_avisar_tema
  AFTER INSERT OR UPDATE OF role ON public.profile_hashtags
  FOR EACH ROW EXECUTE FUNCTION public.avisar_tema_con_voluntario();

-- ─── 2. guía para quien acompaña ──────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS guia_voluntario_leida_en timestamptz;

CREATE OR REPLACE FUNCTION public.marcar_guia_voluntario_leida()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE profiles SET guia_voluntario_leida_en = now()
   WHERE id = (SELECT auth.uid()) AND deleted_at IS NULL AND guia_voluntario_leida_en IS NULL;
$$;

REVOKE ALL ON FUNCTION public.marcar_guia_voluntario_leida() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_guia_voluntario_leida() TO authenticated;

-- ─── 3. acuse de los reportes ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.acusar_reporte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.reporter_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'INSERT' THEN
    PERFORM encolar_correo(
      NEW.reporter_id,
      'Hemos recibido tu reporte',
      '<p>Hola,</p>'
        || '<p>Hemos recibido tu reporte en metoo. Lo revisa una persona, no un sistema '
        || 'automático, y te escribiremos cuando lo hayamos hecho.</p>'
        || '<p>Si crees que alguien está en peligro ahora mismo, no esperes: llama al '
        || '<strong>112</strong>. Si eres tú quien lo está pasando mal, el <strong>024</strong> '
        || 'atiende gratis las 24 horas.</p>',
      false
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.resolved AND NOT coalesce(OLD.resolved, false) THEN
    PERFORM encolar_correo(
      NEW.reporter_id,
      'Hemos revisado tu reporte',
      '<p>Hola,</p>'
        || '<p>Ya hemos revisado el reporte que nos enviaste en metoo y hemos tomado las '
        || 'medidas que nos parecieron oportunas. Gracias por ayudarnos a cuidar la comunidad.</p>'
        || '<p>Si no estás de acuerdo o quieres contarnos algo más, contesta a este correo o '
        || 'escríbenos a juan@bay-apps.com en los próximos seis meses.</p>',
      false
    );
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.acusar_reporte() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reports_acusar ON public.reports;
CREATE TRIGGER reports_acusar
  AFTER INSERT OR UPDATE OF resolved ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.acusar_reporte();

-- ─── la baja borra también los avisos ─────────────────────────────────────

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
