-- Supabase concede EXECUTE a anon/authenticated por defecto en el esquema
-- public, así que `REVOKE ... FROM PUBLIC` no basta: hay que revocar de los
-- roles concretos.
--
-- purge_old_rate_limits() era invocable vía /rest/v1/rpc por cualquier usuario:
-- borrar los contadores anula el rate limiting entero.
REVOKE ALL ON FUNCTION public.purge_old_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.requeue_stuck_emails() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.blocked_user_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_connection_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_unread_count(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.blocked_user_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_connection_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_count(uuid) TO authenticated;

-- search_path mutable en una SECURITY DEFINER permite secuestrar la resolución
-- de nombres desde el rol que la invoca.
ALTER FUNCTION public.get_unread_count(uuid) SET search_path = public;

-- Integridad de dominio: `role` y `status` eran text libre.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('seeker','volunteer'));

ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_status_check;
ALTER TABLE public.connections
  ADD CONSTRAINT connections_status_check CHECK (status IN ('pending','accepted','rejected'));
