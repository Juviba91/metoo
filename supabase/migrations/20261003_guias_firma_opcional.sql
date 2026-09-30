-- Firmar una aportación con el alias: opcional, y reversible.
--
-- Decisión de Juan: que lo elija cada uno al escribir. El riesgo conocido es
-- que nadie lee las casillas, y que estas páginas son públicas e indexables, así
-- que un descuido acaba en Google. De ahí las tres cosas de esta migración:
--
-- 1. Por defecto NO se firma. La columna nace en `false`.
-- 2. La vista solo expone el alias si la fila lo pide. No se filtra en el
--    cliente: si no está marcada, el alias no sale de la base.
-- 3. `quitar_mi_firma_en_guias()` deja de mostrar el alias en TODO lo que esa
--    persona haya escrito, de una vez. Eso convierte un descuido en algo
--    reversible, que era la objeción de fondo.

ALTER TABLE public.guia_respuestas
  ADD COLUMN IF NOT EXISTS mostrar_alias boolean NOT NULL DEFAULT false;

-- El alias sale solo si esa aportación lo pidió. `autor_rol` sigue saliendo
-- siempre: son dos valores para toda la app y no identifican a nadie.
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
         a.role AS autor_rol,
         CASE WHEN r.mostrar_alias THEN a.alias END AS autor_alias
    FROM public.guia_respuestas r
    JOIN public.hospitals h ON h.id = r.hospital_id
    JOIN public.hashtags t ON t.id = r.hashtag_id
    JOIN public.guia_preguntas p ON p.id = r.pregunta_id
    LEFT JOIN public.profiles a ON a.id = r.autor_id
   WHERE NOT r.oculta;

GRANT SELECT ON public.guias_publicas TO anon, authenticated;

-- La firma llega como quinto parámetro con default, así que el código anterior
-- (cuatro argumentos) sigue funcionando mientras se despliega el nuevo.
DROP FUNCTION IF EXISTS public.aportar_a_guia(text, text, uuid, text);

CREATE OR REPLACE FUNCTION public.aportar_a_guia(
  p_hospital_slug text,
  p_tema_slug text,
  p_pregunta_id uuid,
  p_contenido text,
  p_mostrar_alias boolean DEFAULT false
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

  INSERT INTO guia_respuestas
    (hospital_id, hashtag_id, pregunta_id, contenido, autor_id, mostrar_alias)
  VALUES
    (v_hospital, v_tema, p_pregunta_id, v_texto, v_user, coalesce(p_mostrar_alias, false))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.aportar_a_guia(text, text, uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aportar_a_guia(text, text, uuid, text, boolean) TO authenticated;

-- Arrepentirse tiene que ser posible y de un clic: una casilla marcada sin
-- pensar no puede ser una decisión definitiva cuando el resultado lo indexa
-- Google. Devuelve cuántas aportaciones ha dejado sin firma.
CREATE OR REPLACE FUNCTION public.quitar_mi_firma_en_guias()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_filas integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  UPDATE guia_respuestas SET mostrar_alias = false
   WHERE autor_id = v_user AND mostrar_alias;

  GET DIAGNOSTICS v_filas = ROW_COUNT;
  RETURN v_filas;
END;
$$;

REVOKE ALL ON FUNCTION public.quitar_mi_firma_en_guias() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.quitar_mi_firma_en_guias() TO authenticated;
