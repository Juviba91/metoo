-- Las guías las escribe cualquiera, de cualquier tema.
--
-- Se quitan las dos comprobaciones que tenía `aportar_a_guia`:
--
-- 1. El rol de voluntario. Quien está ingresado AHORA tiene la información más
--    fresca —si la cafetería sigue abierta, cómo son hoy las visitas— y esa
--    persona es un seeker. Estaba previsto abrirlo: el rol se comprobaba dentro
--    de la función y no en una política justo para que fuese una línea.
--
-- 2. Que el tema estuviese en el perfil de quien escribe. El catálogo de
--    etiquetas es libre y tiene cuatro formas de decir lo mismo
--    (`prematuros`, `uci-neonatal`, `gemelos-prematuros`, `siete-mesinos`), así
--    que exigir la coincidencia exacta dejaba fuera a gente que sí lo ha
--    vivido. Se apreció al ver que el dueño de la app no podía escribir las dos
--    preguntas de neonatal de su propio hospital.
--
-- Lo que queda como freno: tener cuenta y no estar de baja, el rate limit, la
-- longitud, que la pregunta corresponda a la guía, y la moderación a
-- posteriori.
--
-- Consecuencia asumida: la página pública decía "lo escriben familias que han
-- pasado por AQUÍ" y eso ya no se puede sostener, así que el texto pasa a "que
-- han pasado por algo parecido". La promesa del hospital nunca se comprobó
-- —la restricción era del tema, no del centro— así que se deja de prometer.

CREATE OR REPLACE FUNCTION public.aportar_a_guia(
  p_hospital_slug text,
  p_tema_slug text,
  p_pregunta_id uuid,
  p_contenido text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_texto text := trim(coalesce(p_contenido, ''));
  v_hospital uuid;
  v_tema uuid;
  v_permitido boolean;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- Que la cuenta exista y no esté dada de baja.
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF char_length(v_texto) < 10 OR char_length(v_texto) > 600 THEN
    RAISE EXCEPTION 'La aportación tiene que tener entre 10 y 600 caracteres';
  END IF;

  SELECT id INTO v_hospital FROM hospitals WHERE slug = p_hospital_slug;
  IF v_hospital IS NULL THEN
    RAISE EXCEPTION 'Ese hospital no existe';
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

  INSERT INTO guia_respuestas (hospital_id, hashtag_id, pregunta_id, contenido, autor_id)
  VALUES (v_hospital, v_tema, p_pregunta_id, v_texto, v_user)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
