-- Dos cosas: borrar tu propia respuesta de una guía, y el chat del equipo en
-- tiempo real.
--
-- Se puede ejecutar más de una vez sin efecto.

-- ─── borrar tu propia respuesta ───────────────────────────────────────────
-- Los términos y la política de privacidad dicen que lo que escribes en las
-- guías lo puedes retirar. Hasta ahora había que pedírnoslo; ahora lo hace
-- quien la escribió, desde la propia guía. Se borra de verdad (no se oculta):
-- es su texto y lo está retirando.

CREATE OR REPLACE FUNCTION public.borrar_aportacion(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  DELETE FROM guia_respuestas WHERE id = p_id AND autor_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No puedes borrar esta aportación';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.borrar_aportacion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.borrar_aportacion(uuid) TO authenticated;

-- ─── el chat del equipo, en vivo ──────────────────────────────────────────
-- Hasta ahora la pantalla preguntaba cada 8 segundos si había mensajes. Con
-- la tabla en la publicación de Realtime, el mensaje llega al momento. Cada
-- persona solo recibe los suyos: Realtime respeta la política de lectura
-- (`mensajes_equipo_propios_select`).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mensajes_equipo'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes_equipo;
  END IF;
END
$$;
