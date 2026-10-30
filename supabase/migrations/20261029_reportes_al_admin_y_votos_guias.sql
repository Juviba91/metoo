-- 1. CADA REPORTE TE LLEGA POR CORREO.
--    Hasta ahora un reporte —también el de «puede estar en riesgo»— solo se
--    veía entrando en /admin. Ahora llega un correo al momento a la dirección
--    de moderación; si el motivo es de riesgo, el asunto lo dice. El asunto no
--    lleva nada de lo que escribió nadie (se ve en la pantalla de bloqueo).
--
-- 2. «¿TE HA SERVIDO?» EN LAS GUÍAS (`guia_votos`).
--    Un toque, sin cuenta (las guías se leen sin cuenta). No se guarda quién
--    vota: solo la guía, sí o no y cuándo. Se escribe solo por la función
--    `votar_guia`; la tabla no tiene políticas y solo la lee el admin.

-- ─── utilidad: encolar un correo a una dirección fija ─────────────────────

CREATE OR REPLACE FUNCTION public.encolar_correo_a(p_email text, p_asunto text, p_html text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_from text;
BEGIN
  SELECT decrypted_secret INTO v_from FROM vault.decrypted_secrets WHERE name = 'from_email';
  IF v_from IS NULL THEN
    INSERT INTO email_queue (recipient_email, subject, html_body) VALUES (p_email, p_asunto, p_html);
  ELSE
    INSERT INTO email_queue (recipient_email, subject, html_body, from_email)
    VALUES (p_email, p_asunto, p_html, v_from);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.encolar_correo_a(text, text, text) FROM PUBLIC, anon, authenticated;

-- ─── 1. acuse a quien reporta + aviso a moderación ────────────────────────

CREATE OR REPLACE FUNCTION public.acusar_reporte()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_riesgo boolean;
  v_destino text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_riesgo := NEW.reason ILIKE '%riesgo%';

    SELECT decrypted_secret INTO v_destino FROM vault.decrypted_secrets WHERE name = 'moderacion_email';
    PERFORM encolar_correo_a(
      coalesce(v_destino, 'juan@bay-apps.com'),
      CASE WHEN v_riesgo THEN '⚠️ Reporte de RIESGO en metoo: míralo ya'
           ELSE 'Nuevo reporte en metoo' END,
      '<p><strong>Motivo:</strong> '
        || replace(replace(NEW.reason, '<', '&lt;'), '>', '&gt;') || '</p>'
        || CASE WHEN NEW.description IS NOT NULL
             THEN '<p><strong>Lo que cuenta:</strong> '
                  || replace(replace(NEW.description, '<', '&lt;'), '>', '&gt;') || '</p>'
             ELSE '' END
        || CASE WHEN v_riesgo
             THEN '<p>Si crees que hay peligro inmediato para alguien, llama al 112.</p>'
             ELSE '' END
        || '<p><a href="https://www.metoonetwork.xyz/admin">Abrir el panel →</a></p>'
    );

    IF NEW.reporter_id IS NOT NULL THEN
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
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.resolved AND NOT coalesce(OLD.resolved, false)
        AND NEW.reporter_id IS NOT NULL THEN
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

-- ─── 2. votos de las guías ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guia_votos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  util boolean NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guia_votos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.guia_votos FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.votar_guia(p_hospital_slug text, p_tema_slug text, p_util boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_hospital uuid;
  v_tema uuid;
BEGIN
  IF p_util IS NULL THEN
    RAISE EXCEPTION 'Voto no válido';
  END IF;
  SELECT id INTO v_hospital FROM hospitals WHERE slug = p_hospital_slug;
  SELECT id INTO v_tema FROM hashtags WHERE slug = p_tema_slug;
  IF v_hospital IS NULL OR v_tema IS NULL THEN
    RAISE EXCEPTION 'Esa guía no existe';
  END IF;
  INSERT INTO guia_votos (hospital_id, hashtag_id, util) VALUES (v_hospital, v_tema, p_util);
END;
$$;

REVOKE ALL ON FUNCTION public.votar_guia(text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.votar_guia(text, text, boolean) TO anon, authenticated;
