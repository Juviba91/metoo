-- Preferencia de notificaciones por email.
-- Sin esta columna, el select de app/dashboard/perfil/page.tsx fallaba entero
-- y la página redirigía a /onboarding a cualquier usuario.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true;

-- profiles_update no tenía WITH CHECK: permitía dejar la fila en un estado ajeno.
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- La política UPDATE de connections solo permite al voluntario, así que el
-- seeker nunca podía escribir seeker_last_read_at y su badge de no leídos no
-- se limpiaba nunca. Se resuelve con una RPC acotada en lugar de ampliar la
-- política, que dejaría al seeker auto-aceptar su propia conexión.
CREATE OR REPLACE FUNCTION public.mark_connection_read(p_connection_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_seeker uuid;
  v_volunteer uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  SELECT seeker_id, volunteer_id INTO v_seeker, v_volunteer
    FROM connections WHERE id = p_connection_id;

  IF v_seeker IS NULL THEN
    RETURN;
  END IF;

  IF v_user = v_seeker THEN
    UPDATE connections SET seeker_last_read_at = now() WHERE id = p_connection_id;
  ELSIF v_user = v_volunteer THEN
    UPDATE connections SET volunteer_last_read_at = now() WHERE id = p_connection_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_connection_read(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_connection_read(uuid) TO authenticated;
