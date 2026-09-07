-- Borrado de cuenta desde la propia app.
--
-- Hasta ahora la única vía era escribir un correo y que alguien lo hiciera a
-- mano. En una app donde la gente cuenta un diagnóstico o un duelo, "escríbeme
-- y ya lo borro yo" es pedir demasiada confianza: quien quiere irse tiene que
-- poder irse solo, en el momento.
--
-- Se hace con una función SECURITY DEFINER en lugar de con la service role key
-- en el servidor de Next: así la clave que lo puede borrar todo no vive en las
-- variables de entorno de la app. La función solo sabe borrar UNA fila, la de
-- quien llama.
--
-- El encadenado ya estaba puesto y no se toca:
--   auth.users  --CASCADE-->  profiles  --CASCADE-->  connections, messages,
--                                                      posts, post_reactions,
--                                                      profile_hashtags,
--                                                      profile_categories
--   auth.users  --CASCADE-->  blocks, rate_limits
--   profiles    --SET NULL->  reports, feedback, hashtag_suggestions
--
-- Los tres últimos se quedan sin autor a propósito: el historial de moderación
-- tiene que sobrevivir a la marcha de una persona sin seguir identificándola.

CREATE OR REPLACE FUNCTION public.eliminar_mi_cuenta()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  -- Sin sesión no hay nada que borrar. Se corta explícitamente: un
  -- `WHERE id = NULL` no borraría nada, pero devolvería éxito y la app
  -- enseñaría "cuenta eliminada" a quien no ha eliminado nada.
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

-- Solo con sesión iniciada. `anon` no la puede ni invocar.
REVOKE ALL ON FUNCTION public.eliminar_mi_cuenta() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.eliminar_mi_cuenta() TO authenticated;
