-- Contar las solicitudes pendientes en una sola consulta.
--
-- Estaba en la app: primero `blocked_user_ids()` para saber a quién descontar,
-- y luego un count con ese filtro. Dos idas y vueltas encadenadas, y en las
-- páginas de perfil se pagaban enteras porque allí los bloqueos no estaban ya
-- cargados. Cada pestaña las paga antes de poder pintar nada.
--
-- El filtro es SQL: que lo haga la base de datos, que lo tiene al lado.

CREATE OR REPLACE FUNCTION public.get_pending_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT count(*)::int
    FROM connections c
   WHERE c.volunteer_id = auth.uid()
     AND c.status = 'pending'
     AND NOT EXISTS (
       SELECT 1 FROM blocks b
        WHERE (b.blocker_id = auth.uid() AND b.blocked_id = c.seeker_id)
           OR (b.blocker_id = c.seeker_id AND b.blocked_id = auth.uid())
     )
$$;

REVOKE ALL ON FUNCTION public.get_pending_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_count() TO authenticated;
