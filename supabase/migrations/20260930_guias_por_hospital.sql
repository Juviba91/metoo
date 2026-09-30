-- Guías por hospital y tema: lo que las familias aprendieron allí.
--
-- Una guía es un par (hospital, tema). Las dos tablas ya existían: `hospitals`
-- con 20 filas y `hashtags` con 28, así que la "especialidad" son las etiquetas
-- de siempre y no hay vocabulario nuevo que mantener.
--
-- Por qué existe: sirve con cero personas conectadas. Alguien en la UCIN a las
-- 3 de la mañana no va a encontrar a un voluntario despierto, pero lo que otras
-- familias aprendieron en SU hospital le sirve en ese momento. Y es enlazable e
-- indexable, así que una asociación puede reenviar su página.
--
-- Las preguntas son DATOS, no código: se cambian desde el panel sin desplegar.
-- Eso importa porque nadie sabe todavía si son las preguntas correctas, y la
-- forma de averiguarlo es mirar qué contestan los voluntarios.

-- ---------------------------------------------------------------------------
-- Slugs para las URL. Sin extensiones: `unaccent` no está instalada y no hace
-- falta, translate() basta para castellano.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.slugify(txt text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' FROM regexp_replace(
    lower(translate(
      coalesce(txt, ''),
      'ÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇáàäâãåéèëêíìïîóòöôõúùüûñç',
      'AAAAAAEEEEIIIIOOOOOUUUUNCaaaaaaeeeeiiiiooooouuuunc'
    )),
    '[^a-z0-9]+', '-', 'g'
  ))
$$;

/**
 * El slug del hospital, sin el prefijo que llevan casi todos.
 *
 * El nombre completo da `hospital-universitario-la-paz`, y estas URL están
 * hechas para pegarse en un WhatsApp. Quitando el prefijo sale `la-paz`,
 * `12-de-octubre`, `ramon-y-cajal`. Comprobado contra los 20 hospitales de la
 * tabla: siguen siendo únicos y el más largo baja de 51 a 28 caracteres.
 *
 * Si algún día entran dos hospitales que colisionen al recortar, el índice
 * único lo va a cantar en el momento de insertarlos, que es cuando toca.
 */
CREATE OR REPLACE FUNCTION public.slug_hospital(nombre text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' FROM regexp_replace(
    trim(both '-' FROM regexp_replace(
      public.slugify(nombre),
      '^(hospital-general-universitario|hospital-universitario|clinica-universidad-de|hospital|clinica)-',
      ''
    )),
    '^(de|del)-', ''
  ))
$$;

ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS slug text;
UPDATE public.hospitals SET slug = public.slug_hospital(name) WHERE slug IS NULL;
ALTER TABLE public.hospitals ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS hospitals_slug_key ON public.hospitals (slug);

-- El catálogo de hospitales se lee sin sesión: la página pública necesita
-- resolver el slug antes de saber si hay alguien mirando.
GRANT SELECT ON public.hospitals TO anon;

-- ---------------------------------------------------------------------------
-- Las preguntas. Curadas, no las escribe el usuario.
-- `hashtag_id` nulo = vale para cualquier tema.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guia_preguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag_id uuid REFERENCES public.hashtags(id) ON DELETE CASCADE,
  orden smallint NOT NULL,
  enunciado text NOT NULL CHECK (char_length(enunciado) BETWEEN 5 AND 120),
  ayuda text CHECK (ayuda IS NULL OR char_length(ayuda) <= 300),
  activa boolean NOT NULL DEFAULT true
);

ALTER TABLE public.guia_preguntas ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.guia_preguntas TO anon, authenticated;

DROP POLICY IF EXISTS guia_preguntas_lectura ON public.guia_preguntas;
CREATE POLICY guia_preguntas_lectura ON public.guia_preguntas
  FOR SELECT TO anon, authenticated USING (activa);

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

  -- Para moderar, NO para mostrar. No sale nunca por la vista pública.
  -- SET NULL y no CASCADE: si alguien se da de baja, lo que aportó sigue
  -- sirviendo a quien llegue mañana. Mismo criterio que con las conversaciones.
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  creada_en timestamptz NOT NULL DEFAULT now(),
  revisada_en timestamptz NOT NULL DEFAULT now(),

  oculta boolean NOT NULL DEFAULT false,
  oculta_motivo text
);

CREATE INDEX IF NOT EXISTS guia_respuestas_pagina_idx
  ON public.guia_respuestas (hospital_id, hashtag_id) WHERE NOT oculta;

ALTER TABLE public.guia_respuestas ENABLE ROW LEVEL SECURITY;

-- Nadie lee la tabla directamente. Ni anon ni authenticated: el `autor_id` no
-- puede salir por la API ni pidiendo `*`.
REVOKE ALL ON public.guia_respuestas FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Lectura pública, por vistas.
--
-- SIN `security_invoker`: a propósito. Con él, la vista se ejecutaría con los
-- permisos de quien llama, y `anon` no tiene ninguno sobre `guia_respuestas`,
-- así que devolvería cero filas siempre. Por defecto se ejecuta con los del
-- dueño, que es justo el patrón de "vista como barrera": se ve lo que la vista
-- deja ver y nada más.
-- ---------------------------------------------------------------------------
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
         r.revisada_en
    FROM public.guia_respuestas r
    JOIN public.hospitals h ON h.id = r.hospital_id
    JOIN public.hashtags t ON t.id = r.hashtag_id
    JOIN public.guia_preguntas p ON p.id = r.pregunta_id
   WHERE NOT r.oculta;

-- Índice de guías que tienen algo escrito. Una guía existe solo cuando alguien
-- ha aportado: 20 hospitales por 28 temas son 560 páginas, y generarlas todas
-- sería un pueblo fantasma.
CREATE OR REPLACE VIEW public.guias_indice AS
  SELECT h.slug AS hospital_slug,
         h.name AS hospital,
         h.city AS ciudad,
         t.slug AS tema_slug,
         t.label AS tema,
         count(*)::int AS aportaciones,
         max(r.revisada_en) AS ultima
    FROM public.guia_respuestas r
    JOIN public.hospitals h ON h.id = r.hospital_id
    JOIN public.hashtags t ON t.id = r.hashtag_id
   WHERE NOT r.oculta
   GROUP BY h.slug, h.name, h.city, t.slug, t.label;

GRANT SELECT ON public.guias_publicas TO anon, authenticated;
GRANT SELECT ON public.guias_indice TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Escritura: por función, para no dar INSERT sobre la tabla.
--
-- Hoy solo voluntarios. El rol se comprueba AQUÍ y no en una política, para
-- que abrirlo a quien busca apoyo el día que se decida sea una línea.
-- ---------------------------------------------------------------------------
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
  v_rol text;
  v_texto text := trim(coalesce(p_contenido, ''));
  v_hospital uuid;
  v_tema uuid;
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

  SELECT id INTO v_hospital FROM hospitals WHERE slug = p_hospital_slug;
  IF v_hospital IS NULL THEN
    RAISE EXCEPTION 'Ese hospital no existe';
  END IF;

  SELECT id INTO v_tema FROM hashtags WHERE slug = p_tema_slug;
  IF v_tema IS NULL THEN
    RAISE EXCEPTION 'Ese tema no existe';
  END IF;

  -- Solo sobre lo que esa persona ha vivido: el tema tiene que estar en su
  -- perfil. Si no, cualquiera escribiría sobre cualquier cosa.
  IF NOT EXISTS (
    SELECT 1 FROM profile_hashtags ph
     WHERE ph.profile_id = v_user AND ph.hashtag_id = v_tema
  ) THEN
    RAISE EXCEPTION 'Solo puedes escribir sobre los temas que tienes en tu perfil';
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

REVOKE ALL ON FUNCTION public.aportar_a_guia(text, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aportar_a_guia(text, text, uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Las preguntas de salida. Se cambian desde el panel sin tocar el código.
-- Las siete primeras valen para cualquier tema; las dos últimas son de
-- prematuros, que es donde lo práctico pesa más.
-- ---------------------------------------------------------------------------
INSERT INTO public.guia_preguntas (hashtag_id, orden, enunciado, ayuda)
VALUES
  (NULL, 1, 'Lo primero que agradecerías saber el primer día',
   'Dónde entrar, a quién preguntar, qué pasa las primeras horas.'),
  (NULL, 2, '¿Dónde se puede descansar, comer o estar un rato a solas?',
   'Salas de familias, qué hay abierto de noche, si se puede dormir allí.'),
  (NULL, 3, 'Horarios y normas de visita, en la práctica',
   'Lo que dicen y lo que de verdad pasa. Cuántas personas, si entran los hermanos.'),
  (NULL, 4, '¿Qué llevarte que no viene en ninguna lista?',
   'Lo pequeño y concreto: alargador, botella, auriculares, una libreta.'),
  (NULL, 5, 'Trámites y papeles que nadie te explica',
   'Bajas, permisos, ayudas, informes, el aparcamiento. Dónde se piden.'),
  (NULL, 6, '¿A quién del hospital puedes pedir ayuda?',
   'Por su función, nunca por su nombre: trabajo social, enfermería de referencia, psicología.'),
  (NULL, 7, 'Algo que te ayudó y no esperabas',
   'Una rutina, una frase, algo que hiciste y que te sostuvo.')
ON CONFLICT DO NOTHING;

INSERT INTO public.guia_preguntas (hashtag_id, orden, enunciado, ayuda)
SELECT h.id, 8, 'Lactancia y sacaleches',
       'Si hay sala, si prestan, dónde guardar la leche, horarios.'
  FROM public.hashtags h WHERE h.slug = 'prematuros'
ON CONFLICT DO NOTHING;

INSERT INTO public.guia_preguntas (hashtag_id, orden, enunciado, ayuda)
SELECT h.id, 9, 'Método canguro',
       'Cómo funciona aquí, cuánto tiempo, si el acompañante también puede.'
  FROM public.hashtags h WHERE h.slug = 'prematuros'
ON CONFLICT DO NOTHING;
