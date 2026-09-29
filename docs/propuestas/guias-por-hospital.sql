-- Guías por hospital y tema: lo que las familias aprendieron allí.
--
-- PROPUESTA, sin aplicar todavía. La interfaz no existe aún; esto es la forma
-- que tendrían los datos, para poder discutirla antes de escribir pantallas.
--
-- Por qué así, en corto:
--
-- · Una guía es un par (hospital, tema). Las dos tablas ya existen —`hospitals`
--   tiene 20 filas y `hashtags` 28— así que la "especialidad" son las etiquetas
--   de siempre y no hay vocabulario nuevo que mantener.
--
-- · Las respuestas NO se firman. El autor se guarda para poder moderar, pero no
--   se muestra nunca ni sale por la API pública. Es lo que permite tener
--   páginas por hospital sin atar un alias a un hospital y un diagnóstico, que
--   en una ciudad pequeña es un nombre y un apellido. Ver la decisión de
--   `hospital_id` en CLAUDE.md: esto la respeta en vez de saltársela.
--
-- · Preguntas fijas, no una página en blanco. La bio son 300 caracteres y la
--   gente escribe 98: quien está en mitad de algo no redacta, pero sí contesta
--   a "¿dónde puede dormir un acompañante?". Y hace las guías comparables
--   entre hospitales, que es lo que las vuelve útiles.
--
-- · Una guía existe solo cuando alguien ha escrito algo en ella. 20 hospitales
--   por 28 temas son 560 páginas: generarlas todas sería un pueblo fantasma.

-- ---------------------------------------------------------------------------
-- Las preguntas. Curadas, no las escribe el usuario.
-- `hashtag_id` nulo = la pregunta vale para cualquier tema.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guia_preguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag_id uuid REFERENCES public.hashtags(id) ON DELETE CASCADE,
  orden smallint NOT NULL,
  enunciado text NOT NULL CHECK (char_length(enunciado) BETWEEN 5 AND 120),
  ayuda text CHECK (ayuda IS NULL OR char_length(ayuda) <= 300),
  activa boolean NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- Las respuestas. Varias personas pueden contestar la misma pregunta.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guia_respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  pregunta_id uuid NOT NULL REFERENCES public.guia_preguntas(id) ON DELETE CASCADE,

  -- Corto a propósito: si necesita más, la pregunta está mal planteada.
  contenido text NOT NULL CHECK (char_length(contenido) BETWEEN 10 AND 600),

  -- Para moderar, NO para mostrar. Nunca sale en la lectura pública.
  -- ON DELETE SET NULL, no CASCADE: si alguien se da de baja, lo que aportó a
  -- una guía sigue sirviéndole a quien llegue mañana. Es lo mismo que se
  -- decidió con las conversaciones, y por la misma razón.
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- La información práctica se pudre: los horarios cambian y la cafetería
  -- cierra. Sin fecha visible, un dato viejo se lee como actual.
  creada_en timestamptz NOT NULL DEFAULT now(),
  revisada_en timestamptz NOT NULL DEFAULT now(),

  -- Moderación: se oculta sin borrar, para poder revertir y para no perder el
  -- rastro de quién escribió qué.
  oculta boolean NOT NULL DEFAULT false,
  oculta_motivo text
);

CREATE INDEX IF NOT EXISTS guia_respuestas_pagina_idx
  ON public.guia_respuestas (hospital_id, hashtag_id) WHERE NOT oculta;

-- ---------------------------------------------------------------------------
-- Lectura: pública de verdad, sin sesión. Es lo que permite que una asociación
-- reenvíe el enlace y que alguien lo lea a las 3 de la mañana sin registrarse.
--
-- Se lee por una vista, no por la tabla, para que `autor_id` y el motivo de
-- ocultación no salgan nunca por la API por mucho que alguien pida `*`.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.guias_publicas
WITH (security_invoker = true) AS
  SELECT r.id,
         h.id AS hospital_id,
         h.name AS hospital,
         h.city AS ciudad,
         t.slug AS tema_slug,
         t.label AS tema,
         p.id AS pregunta_id,
         p.orden,
         p.enunciado,
         r.contenido,
         r.revisada_en
    FROM guia_respuestas r
    JOIN hospitals h ON h.id = r.hospital_id
    JOIN hashtags t ON t.id = r.hashtag_id
    JOIN guia_preguntas p ON p.id = r.pregunta_id
   WHERE NOT r.oculta;

ALTER TABLE public.guia_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guia_preguntas ENABLE ROW LEVEL SECURITY;

-- Nadie lee la tabla directamente: ni anon ni authenticated.
REVOKE ALL ON public.guia_respuestas FROM anon, authenticated;
GRANT SELECT ON public.guia_preguntas TO anon, authenticated;
CREATE POLICY guia_preguntas_lectura ON public.guia_preguntas
  FOR SELECT TO anon, authenticated USING (activa);

GRANT SELECT ON public.guias_publicas TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Escritura: por función, para no tener que dar INSERT sobre la tabla.
--
-- Hoy solo voluntarios. Abrirlo después a quien busca apoyo es cambiar una
-- línea de esta función, no rehacer nada: por eso el rol se comprueba aquí y
-- no en una política.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.aportar_a_guia(
  p_hospital_id uuid,
  p_hashtag_id uuid,
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
  v_rol text;
  v_texto text := trim(coalesce(p_contenido, ''));
  v_permitido boolean;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT role INTO v_rol FROM profiles
   WHERE id = v_user AND deleted_at IS NULL;

  -- Aquí se abriría a 'seeker' el día que se decida.
  IF v_rol IS DISTINCT FROM 'volunteer' THEN
    RAISE EXCEPTION 'Solo los voluntarios pueden escribir en las guías';
  END IF;

  IF char_length(v_texto) < 10 OR char_length(v_texto) > 600 THEN
    RAISE EXCEPTION 'La aportación tiene que tener entre 10 y 600 caracteres';
  END IF;

  -- La pregunta tiene que ser de este tema (o general) y estar activa.
  IF NOT EXISTS (
    SELECT 1 FROM guia_preguntas q
     WHERE q.id = p_pregunta_id AND q.activa
       AND (q.hashtag_id IS NULL OR q.hashtag_id = p_hashtag_id)
  ) THEN
    RAISE EXCEPTION 'Esa pregunta no corresponde a esta guía';
  END IF;

  SELECT c.allowed INTO v_permitido FROM check_rate_limit('guia_aporte', 20) c;
  IF NOT coalesce(v_permitido, false) THEN
    RAISE EXCEPTION 'Has escrito muchas aportaciones seguidas. Inténtalo más tarde.';
  END IF;

  INSERT INTO guia_respuestas (hospital_id, hashtag_id, pregunta_id, contenido, autor_id)
  VALUES (p_hospital_id, p_hashtag_id, p_pregunta_id, v_texto, v_user)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.aportar_a_guia(uuid, uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aportar_a_guia(uuid, uuid, uuid, text) TO authenticated;
