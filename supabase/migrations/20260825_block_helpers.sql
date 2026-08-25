-- Comprobación puntual de bloqueo. canInteractWith() traía la lista entera de
-- bloqueos del usuario solo para mirar un id.
CREATE OR REPLACE FUNCTION public.is_blocked_with(p_other uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blocks
     WHERE (blocker_id = auth.uid() AND blocked_id = p_other)
        OR (blocker_id = p_other   AND blocked_id = auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_blocked_with(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked_with(uuid) TO authenticated;

-- get_unread_count contaba mensajes de usuarios bloqueados, así que el badge
-- marcaba conversaciones que ya no aparecen en ninguna pantalla.
CREATE OR REPLACE FUNCTION public.get_unread_count(user_uuid uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT m.connection_id)::bigint
  FROM messages m
  JOIN connections c ON c.id = m.connection_id
  WHERE
    m.sender_id <> user_uuid
    AND NOT EXISTS (
      SELECT 1 FROM blocks b
       WHERE (b.blocker_id = user_uuid AND b.blocked_id = m.sender_id)
          OR (b.blocker_id = m.sender_id AND b.blocked_id = user_uuid)
    )
    AND (
      (c.seeker_id = user_uuid
        AND (c.seeker_last_read_at IS NULL OR m.created_at > c.seeker_last_read_at))
      OR
      (c.volunteer_id = user_uuid
        AND (c.volunteer_last_read_at IS NULL OR m.created_at > c.volunteer_last_read_at))
    )
$$;

REVOKE ALL ON FUNCTION public.get_unread_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unread_count(uuid) TO authenticated;
