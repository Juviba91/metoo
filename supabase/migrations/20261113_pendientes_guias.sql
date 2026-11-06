-- Tres cosas pendientes de las guías generales.
--
-- 1. La bienvenida a voluntarios todavía decía «escribir la guía de tu
--    hospital», cuando las guías ya son por tema.
-- 2. Editar la propia respuesta. Hasta ahora cada respuesta se añadía y no
--    había forma de corregirla (el panel de admin solo oculta).
-- 3. Quitar lo que dejó de usarse con las guías por hospital.
--
-- Se puede ejecutar más de una vez sin efecto.

-- ─── 1. bienvenida a voluntarios ──────────────────────────────────────────
-- Se cambia la frase dentro de la definición viva de la función, sin
-- copiarla entera, para no arrastrar una versión vieja del resto.

DO $$
DECLARE
  def text;
BEGIN
  def := pg_get_functiondef('public.bienvenida_equipo()'::regprocedure);
  def := replace(def, 'escribir la guía de tu hospital', 'escribir una guía sobre lo que viviste');
  EXECUTE def;
END
$$;

-- Los mensajes ya enviados llevan la misma frase.
UPDATE public.mensajes_equipo
   SET contenido = replace(contenido, 'escribir la guía de tu hospital', 'escribir una guía sobre lo que viviste')
 WHERE del_equipo AND contenido LIKE '%escribir la guía de tu hospital%';

-- ─── 2. editar tu propia respuesta ────────────────────────────────────────
-- Solo quien la escribió, y solo si no está oculta (una aportación ocultada
-- por moderación no se puede reescribir para volver a salir). Las mismas
-- reglas de longitud que al escribirla. La fecha de revisión se renueva: es
-- lo que enseña la guía («octubre de 2026») y lo que avisa de si puede estar
-- desfasada.

CREATE OR REPLACE FUNCTION public.editar_aportacion(p_id uuid, p_contenido text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_texto text := trim(coalesce(p_contenido, ''));
  v_permitido boolean;
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

  SELECT c.allowed INTO v_permitido FROM check_rate_limit('guia_edicion', 30) c;
  IF NOT coalesce(v_permitido, false) THEN
    RAISE EXCEPTION 'Has editado muchas veces seguidas. Inténtalo más tarde.';
  END IF;

  UPDATE guia_respuestas
     SET contenido = v_texto, revisada_en = now()
   WHERE id = p_id AND autor_id = v_user AND NOT oculta;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No puedes editar esta aportación';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.editar_aportacion(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.editar_aportacion(uuid, text) TO authenticated;

-- ─── 3. lo viejo de las guías por hospital ────────────────────────────────
-- Ya nada del código los usa. `votar_guia` seguía abierta a cualquiera sin
-- cuenta, duplicando a `votar_guia_tema`.

DROP FUNCTION IF EXISTS public.aportar_a_guia(text, text, uuid, text, boolean);
DROP FUNCTION IF EXISTS public.votar_guia(text, text, boolean);
DROP FUNCTION IF EXISTS public.quitar_mi_firma_en_guias();
DROP VIEW IF EXISTS public.guias_indice;
