-- Programa el drenado de la cola de emails y la limpieza de rate limits.
--
-- Requiere tres secretos en Vault. Se crean una sola vez y NO se versionan
-- aquí porque son propios de cada proyecto:
--
--   select vault.create_secret(
--     encode(extensions.gen_random_bytes(32), 'hex'), 'cron_secret',
--     'Cabecera x-cron-secret de process-email-queue');
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url', '');
--   select vault.create_secret('<anon-key>', 'anon_key', 'Clave publica, solo para verify_jwt');
--
-- Y el mismo valor de cron_secret como secreto de las Edge Functions:
--   supabase secrets set CRON_SECRET=<valor>
--
-- Para leer el valor generado:
--   select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret';

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Dispara process-email-queue. Si falta configuración no hace nada, para que
-- el job programado no falle en bucle.
CREATE OR REPLACE FUNCTION public.drain_email_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_anon text;
  v_secret text;
  v_pending int;
BEGIN
  SELECT decrypted_secret INTO v_url    FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_anon   FROM vault.decrypted_secrets WHERE name = 'anon_key';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  IF v_url IS NULL OR v_anon IS NULL OR v_secret IS NULL THEN
    RAISE NOTICE 'drain_email_queue: falta configuracion en Vault, no se invoca';
    RETURN;
  END IF;

  -- No se llama a la función si no hay nada que drenar
  SELECT count(*) INTO v_pending
    FROM email_queue
   WHERE status = 'pending' AND next_retry_at <= now();

  IF v_pending = 0 THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/process-email-queue',
    headers := jsonb_build_object(
                 'Content-Type',   'application/json',
                 'Authorization',  'Bearer ' || v_anon,
                 'x-cron-secret',  v_secret
               ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
END;
$$;

-- Solo la invoca pg_cron.
REVOKE ALL ON FUNCTION public.drain_email_queue() FROM PUBLIC, anon, authenticated;

-- Reintentos de email cada 5 minutos
SELECT cron.unschedule('drain-email-queue')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drain-email-queue');

SELECT cron.schedule('drain-email-queue', '*/5 * * * *', 'SELECT public.drain_email_queue()');

-- Limpieza diaria de contadores de rate limit caducados
SELECT cron.unschedule('purge-rate-limits')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-rate-limits');

SELECT cron.schedule('purge-rate-limits', '17 4 * * *', 'SELECT public.purge_old_rate_limits()');
