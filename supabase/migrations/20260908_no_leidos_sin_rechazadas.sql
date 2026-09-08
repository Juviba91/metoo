-- Las conversaciones rechazadas no cuentan como "sin leer".
--
-- En una conversación rechazada no se puede escribir: la app enseña "Esta
-- conversación ha terminado" y esconde el campo de texto. Pero seguía sumando
-- al globo de la barra inferior si quedaba algún mensaje del otro lado sin
-- leer.
--
-- Y desde que a quien busca apoyo no se le enseñan las rechazadas, ese aviso
-- se volvía imposible de quitar: el globo decía "1" y no había ninguna
-- conversación en la lista que abrir para limpiarlo.

CREATE OR REPLACE FUNCTION public.get_unread_count(user_uuid uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(DISTINCT m.connection_id)::bigint
  FROM messages m
  JOIN connections c ON c.id = m.connection_id
  WHERE
    -- Solo por uno mismo. Sin esto, la función contesta por cualquiera.
    user_uuid = auth.uid()
    -- Lo que no se puede contestar no está "sin leer".
    AND c.status <> 'rejected'
    AND m.sender_id <> user_uuid
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
$function$;
