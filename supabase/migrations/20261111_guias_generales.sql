-- Guías generales: una por tema, sin hospital, y con el alias de quien escribe.
--
-- Decisión de Juan: olvidarse de los hospitales y hacerlas más generales, y que
-- cada aportación lleve el alias de quien la escribió, con enlace desde su
-- perfil. Esto REVIERTE la medida U-3 de la nota legal de octubre (alias fuera
-- de la vista pública). Sin hospital la combinación que preocupaba
-- (hospital + tema + alias) ya no existe, y las páginas siguen con `noindex`.
--
-- Compatible hacia atrás: el código desplegado hasta ahora sigue funcionando
-- con lo que hay. La vista conserva sus columnas (el hospital es opcional, no
-- desaparece) y se le añaden dos al final; las funciones y la vista de índice
-- nuevas son aparte. Así se puede aplicar ANTES de mergear.

-- ─── el hospital pasa a ser opcional ──────────────────────────────────────
-- Lo escrito hasta ahora conserva el suyo; lo nuevo no lleva ninguno.

ALTER TABLE public.guia_respuestas ALTER COLUMN hospital_id DROP NOT NULL;
ALTER TABLE public.guia_votos ALTER COLUMN hospital_id DROP NOT NULL;

-- La página de una guía ya no se busca por (hospital, tema) sino por tema, y el
-- perfil busca por autor.
CREATE INDEX IF NOT EXISTS guia_respuestas_tema_idx
  ON public.guia_respuestas (hashtag_id) WHERE NOT oculta;
CREATE INDEX IF NOT EXISTS guia_respuestas_autor_idx
  ON public.guia_respuestas (autor_id) WHERE autor_id IS NOT NULL AND NOT oculta;

-- ─── la vista pública: hospital opcional y alias de quien escribe ─────────
-- El alias y el id salen solo si la cuenta sigue activa: tras una baja
-- `autor_id` ya queda a NULL, y `deleted_at` lo asegura aunque no fuera así.
-- Sin id no habría forma de enlazar al perfil, que es lo que se pide.

CREATE OR REPLACE VIEW public.guias_publicas AS
  SELECT r.id,
         h.slug AS hospital_slug,
         h.name AS hospital,
         h.city AS ciudad,
         t.slug AS tema_slug,
         t.label AS tema,
         p.id AS pregunta_id,
         p.orden,
         p.enunciado,
         p.ayuda,
         r.contenido,
         r.revisada_en,
         CASE
           WHEN r.autor_id IS NULL THEN NULL::text
           ELSE COALESCE(ph.role, a.role)
         END AS autor_rol,
         CASE WHEN a.deleted_at IS NULL THEN a.alias END AS autor_alias,
         CASE WHEN a.deleted_at IS NULL THEN r.autor_id END AS autor_id
    FROM public.guia_respuestas r
    LEFT JOIN public.hospitals h ON h.id = r.hospital_id
    JOIN public.hashtags t ON t.id = r.hashtag_id
    JOIN public.guia_preguntas p ON p.id = r.pregunta_id
    LEFT JOIN public.profiles a ON a.id = r.autor_id
    LEFT JOIN public.profile_hashtags ph
      ON ph.profile_id = r.autor_id AND ph.hashtag_id = r.hashtag_id
   WHERE NOT r.oculta;

GRANT SELECT ON public.guias_publicas TO anon, authenticated;

-- ─── el índice, por tema ──────────────────────────────────────────────────
-- Aparte de `guias_indice` (que agrupa por hospital y se queda para el código
-- anterior).

CREATE OR REPLACE VIEW public.guias_temas AS
  SELECT t.slug AS tema_slug,
         t.label AS tema,
         count(*)::integer AS aportaciones,
         max(r.revisada_en) AS ultima
    FROM public.guia_respuestas r
    JOIN public.hashtags t ON t.id = r.hashtag_id
   WHERE NOT r.oculta
   GROUP BY t.slug, t.label;

GRANT SELECT ON public.guias_temas TO anon, authenticated;

-- ─── escribir en la guía de un tema ───────────────────────────────────────
-- Mismas reglas que `aportar_a_guia` menos el hospital: sesión activa, de 10 a
-- 600 caracteres, tema y pregunta que existan y se correspondan, y límite de
-- 30 por hora.

CREATE OR REPLACE FUNCTION public.aportar_a_tema(
  p_tema_slug text,
  p_pregunta_id uuid,
  p_contenido text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_texto text := trim(coalesce(p_contenido, ''));
  v_tema uuid;
  v_permitido boolean;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF char_length(v_texto) < 10 OR char_length(v_texto) > 600 THEN
    RAISE EXCEPTION 'La aportación tiene que tener entre 10 y 600 caracteres';
  END IF;

  SELECT id INTO v_tema FROM hashtags WHERE slug = p_tema_slug;
  IF v_tema IS NULL THEN
    RAISE EXCEPTION 'Ese tema no existe';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM guia_preguntas q
     WHERE q.id = p_pregunta_id AND q.activa
       AND (q.hashtag_id IS NULL OR q.hashtag_id = v_tema)
  ) THEN
    RAISE EXCEPTION 'Esa pregunta no corresponde a esta guía';
  END IF;

  SELECT c.allowed INTO v_permitido FROM check_rate_limit('guia_aporte', 30) c;
  IF NOT coalesce(v_permitido, false) THEN
    RAISE EXCEPTION 'Has escrito muchas aportaciones seguidas. Inténtalo más tarde.';
  END IF;

  INSERT INTO guia_respuestas (hashtag_id, pregunta_id, contenido, autor_id)
  VALUES (v_tema, p_pregunta_id, v_texto, v_user)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.aportar_a_tema(text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aportar_a_tema(text, uuid, text) TO authenticated;

-- ─── «¿Te ha servido?» por tema ───────────────────────────────────────────
-- Sin cuenta, como la guía: no se guarda quién vota.

CREATE OR REPLACE FUNCTION public.votar_guia_tema(p_tema_slug text, p_util boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tema uuid;
BEGIN
  IF p_util IS NULL THEN
    RAISE EXCEPTION 'Voto no válido';
  END IF;
  SELECT id INTO v_tema FROM hashtags WHERE slug = p_tema_slug;
  IF v_tema IS NULL THEN
    RAISE EXCEPTION 'Esa guía no existe';
  END IF;
  INSERT INTO guia_votos (hashtag_id, util) VALUES (v_tema, p_util);
END;
$$;

GRANT EXECUTE ON FUNCTION public.votar_guia_tema(text, boolean) TO anon, authenticated;
