-- Sustituye a 20260820_safety_features.sql / _email_preferences.sql / _rls_policies.sql,
-- que nunca llegaron a aplicarse:
--   * safety_features tenía UNIQUE(user_id, action, DATE(window_start)); Postgres no
--     admite expresiones en un constraint UNIQUE de tabla, así que la migración
--     entera fallaba y no se creaba ninguna de las tres tablas.
--   * rls_policies activaba RLS en profiles sin política INSERT, lo que habría
--     roto el onboarding. Las políticas reales del proyecto son otras.

-- ---------------------------------------------------------------- bloqueos
CREATE TABLE IF NOT EXISTS public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blocks_unique_pair UNIQUE (blocker_id, blocked_id),
  CONSTRAINT blocks_no_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Solo el que bloquea ve sus bloqueos: el bloqueado no debe poder averiguar
-- quién le ha bloqueado (para filtrar listados está blocked_user_ids()).
DROP POLICY IF EXISTS blocks_select_own ON public.blocks;
CREATE POLICY blocks_select_own ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS blocks_insert_own ON public.blocks;
CREATE POLICY blocks_insert_own ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS blocks_delete_own ON public.blocks;
CREATE POLICY blocks_delete_own ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- ------------------------------------------------------------ cola de email
-- RLS activo y SIN políticas => solo service_role. La cola guarda direcciones
-- de correo y extractos de mensajes privados.
CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  from_email text NOT NULL DEFAULT 'metoo <onboarding@resend.dev>',
  retry_count int NOT NULL DEFAULT 0,
  max_retries int NOT NULL DEFAULT 3,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  error_message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_queue_status_check CHECK (status IN ('pending','sending','sent','failed'))
);

CREATE INDEX IF NOT EXISTS idx_email_queue_drain
  ON public.email_queue(status, next_retry_at) WHERE status = 'pending';

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------- rate limits
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT date_trunc('hour', now()),
  CONSTRAINT rate_limits_unique_window UNIQUE (user_id, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rate_limits_select_own ON public.rate_limits;
CREATE POLICY rate_limits_select_own ON public.rate_limits
  FOR SELECT USING (auth.uid() = user_id);
-- Sin políticas de escritura: solo escribe check_rate_limit() (SECURITY DEFINER)

-- ---------------------------------------------------------------- funciones
-- Contador atómico: INSERT ... ON CONFLICT DO UPDATE en una sola sentencia.
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_action text, p_max int)
RETURNS TABLE (allowed boolean, remaining int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_window timestamptz := date_trunc('hour', now());
  v_count int;
BEGIN
  IF v_user IS NULL THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  INSERT INTO rate_limits (user_id, action, window_start, count)
  VALUES (v_user, p_action, v_window, 1)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1
  RETURNING rate_limits.count INTO v_count;

  IF v_count > p_max THEN
    UPDATE rate_limits SET count = p_max + 1
     WHERE user_id = v_user AND action = p_action AND window_start = v_window;
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, GREATEST(p_max - v_count, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, int) FROM public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int) TO authenticated;

-- Ids a ocultar en listados (bloqueos en ambos sentidos)
CREATE OR REPLACE FUNCTION public.blocked_user_ids()
RETURNS TABLE (user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT blocked_id FROM blocks WHERE blocker_id = auth.uid()
  UNION
  SELECT blocker_id FROM blocks WHERE blocked_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.blocked_user_ids() FROM public;
GRANT EXECUTE ON FUNCTION public.blocked_user_ids() TO authenticated;

-- Reencola lo que quedó reservado por una ejecución del procesador que murió
CREATE OR REPLACE FUNCTION public.requeue_stuck_emails()
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stuck AS (
    UPDATE email_queue
       SET status = 'pending', updated_at = now()
     WHERE status = 'sending'
       AND updated_at < now() - interval '10 minutes'
    RETURNING 1
  )
  SELECT count(*)::int FROM stuck;
$$;

CREATE OR REPLACE FUNCTION public.purge_old_rate_limits()
RETURNS int
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH deleted AS (
    DELETE FROM rate_limits WHERE window_start < now() - interval '2 days' RETURNING 1
  )
  SELECT count(*)::int FROM deleted;
$$;
