-- Read tracking per user per connection
ALTER TABLE connections
  ADD COLUMN IF NOT EXISTS seeker_last_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS volunteer_last_read_at timestamptz;

-- Efficient count of connections with unread messages for a given user
CREATE OR REPLACE FUNCTION get_unread_count(user_uuid uuid)
RETURNS bigint
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(DISTINCT m.connection_id)::bigint
  FROM messages m
  JOIN connections c ON c.id = m.connection_id
  WHERE
    m.sender_id != user_uuid
    AND (
      (c.seeker_id = user_uuid
        AND (c.seeker_last_read_at IS NULL OR m.created_at > c.seeker_last_read_at))
      OR
      (c.volunteer_id = user_uuid
        AND (c.volunteer_last_read_at IS NULL OR m.created_at > c.volunteer_last_read_at))
    )
$$;
