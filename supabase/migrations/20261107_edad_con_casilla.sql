-- Edad: una casilla «Tengo 16 años o más» en vez de la fecha de nacimiento.
--
-- Juan la quitó en noviembre de 2026: era fricción en el último paso del alta
-- para todo el mundo. La app pasa a mandar la casilla; esta es la versión de
-- `renovar_consentimiento` que la recibe. Sigue anotando cuándo se declaró
-- (`edad_comprobada_en`).
--
-- La versión antigua (p_version text, p_nacimiento date) se deja: la app
-- publicada la usa hasta que se despliegue la nueva, y la migración va antes del
-- merge. Es más estricta (pide la fecha), así que no abre ninguna puerta.

CREATE OR REPLACE FUNCTION public.renovar_consentimiento(p_version text, p_mayor_de_edad boolean)
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

  IF p_version IS NULL OR p_version !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Versión de los textos no válida';
  END IF;

  -- La app ya lo comprueba antes; se repite porque esta función se puede
  -- llamar directamente con la clave pública.
  IF p_mayor_de_edad IS NOT TRUE THEN
    RAISE EXCEPTION 'metoo es para personas de 16 años o más';
  END IF;

  UPDATE profiles SET
    consentimiento_en = now(),
    consentimiento_version = p_version,
    consentimiento_salud_en = now(),
    consentimiento_salud_version = p_version,
    edad_comprobada_en = now()
  WHERE id = v_uid AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay perfil';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.renovar_consentimiento(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renovar_consentimiento(text, boolean) TO authenticated;
