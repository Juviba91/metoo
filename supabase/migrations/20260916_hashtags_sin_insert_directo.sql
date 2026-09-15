-- El catálogo de etiquetas estaba abierto de par en par.
--
-- La política `hashtags_auth_insert` tenía `WITH CHECK (true)`: cualquiera con
-- una cuenta podía escribir directamente en `/rest/v1/hashtags` las filas que
-- quisiera. Los límites que creíamos tener (5 etiquetas por publicación, 40
-- caracteres) viven en la server action, y a la server action no hace falta
-- pasar por ella.
--
-- Y no es una tabla cualquiera: el catálogo es común, se le ofrece como
-- sugerencia a todo el mundo al editar su perfil. Llenarlo de basura, o de
-- insultos, se lo come quien está en mitad de un duelo.
--
-- Se cierra el INSERT directo y se pasa por una función que sí comprueba la
-- forma de la etiqueta y gasta rate limit. De paso, la función resuelve en un
-- solo sitio el `ON CONFLICT DO NOTHING` que no devuelve la fila en conflicto:
-- estaba parcheado a mano en los dos sitios que crean etiquetas.

CREATE OR REPLACE FUNCTION public.crear_hashtag(p_slug text, p_label text)
RETURNS TABLE (id uuid, slug text, label text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_slug text := trim(coalesce(p_slug, ''));
  v_label text := trim(coalesce(p_label, ''));
  v_permitido boolean;
  v_fila record;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  -- La misma forma que produce `toSlug` en el cliente. No se recalcula el slug
  -- a partir de la etiqueta a propósito: la normalización de tildes de
  -- JavaScript y la de Postgres no son la misma, y un slug distinto al que usa
  -- el enlace /feed?tag=… deja la etiqueta inencontrable.
  IF v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR char_length(v_slug) < 2 OR char_length(v_slug) > 40
     OR char_length(v_label) < 2 OR char_length(v_label) > 40
     OR v_label ~ '[[:cntrl:]]' THEN
    RAISE EXCEPTION 'Etiqueta no válida';
  END IF;

  -- Si ya existe se devuelve sin gastar rate limit: usar una etiqueta que ya
  -- está en el catálogo es lo normal, y es lo que hace casi todo el mundo.
  SELECT h.id, h.slug, h.label INTO v_fila FROM hashtags h WHERE h.slug = v_slug;
  IF FOUND THEN
    id := v_fila.id; slug := v_fila.slug; label := v_fila.label;
    RETURN NEXT;
    RETURN;
  END IF;

  SELECT c.allowed INTO v_permitido FROM check_rate_limit('hashtag_create', 20) c;
  IF NOT coalesce(v_permitido, false) THEN
    RAISE EXCEPTION 'Has creado demasiadas etiquetas nuevas. Inténtalo más tarde.';
  END IF;

  INSERT INTO hashtags (slug, label) VALUES (v_slug, v_label)
  ON CONFLICT (slug) DO NOTHING;

  -- Releer siempre: si otra petición ganó la carrera, el INSERT no devuelve
  -- nada y la fila buena es la suya.
  SELECT h.id, h.slug, h.label INTO v_fila FROM hashtags h WHERE h.slug = v_slug;
  id := v_fila.id; slug := v_fila.slug; label := v_fila.label;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.crear_hashtag(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_hashtag(text, text) TO authenticated;

-- Ya no se escribe en la tabla desde fuera.
DROP POLICY IF EXISTS hashtags_auth_insert ON public.hashtags;
REVOKE INSERT ON public.hashtags FROM authenticated, anon;
