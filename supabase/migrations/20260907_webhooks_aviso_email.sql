-- Dispara las Edge Functions de aviso por correo. Es lo que el panel de
-- Supabase llama "Database Webhooks", pero hecho como migración por dos
-- razones:
--
--   1. Lo creado desde el panel no queda en el repo y nadie sabe que existe.
--      Este proyecto ya arrastra bastante esquema invisible.
--   2. El webhook del panel dispara en CADA update de la tabla. `connections`
--      se actualiza cada vez que alguien abre un chat (`seeker_last_read_at`,
--      `volunteer_last_read_at`), así que serían cientos de peticiones inútiles
--      al día contra la Edge Function. Con WHEN solo sale una cuando de verdad
--      hay algo que contar.
--
-- La URL y la clave salen de Vault, igual que en `drain_email_queue()`: aquí no
-- se versiona ninguna credencial.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notificar_por_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url  text;
  v_anon text;
  v_body jsonb;
BEGIN
  SELECT decrypted_secret INTO v_url  FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_anon FROM vault.decrypted_secrets WHERE name = 'anon_key';

  -- Sin configuración no se avisa, pero tampoco se rompe la operación que
  -- disparó el trigger: nadie debe quedarse sin poder mandar un mensaje porque
  -- el correo esté mal configurado.
  IF v_url IS NULL OR v_anon IS NULL THEN
    RAISE NOTICE 'notificar_por_email: falta project_url o anon_key en Vault';
    RETURN NULL;
  END IF;

  -- Se arma con la misma forma que manda el webhook del panel, que es lo que
  -- las funciones esperan leer.
  v_body := jsonb_build_object(
    'type',   TG_OP,
    'table',  TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW)
  );

  -- `OLD` no está asignado en un trigger de INSERT: se toca solo en UPDATE.
  IF TG_OP = 'UPDATE' THEN
    v_body := v_body || jsonb_build_object('old_record', to_jsonb(OLD));
  ELSE
    v_body := v_body || jsonb_build_object('old_record', NULL::jsonb);
  END IF;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/' || TG_ARGV[0],
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || v_anon
               ),
    body    := v_body,
    timeout_milliseconds := 10000
  );

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_por_email() FROM PUBLIC, anon, authenticated;

-- Mensaje nuevo → se avisa a la otra parte de la conversación
DROP TRIGGER IF EXISTS avisar_mensaje_nuevo ON public.messages;
CREATE TRIGGER avisar_mensaje_nuevo
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notificar_por_email('notify-message');

-- Solicitud nueva → se avisa al voluntario
DROP TRIGGER IF EXISTS avisar_solicitud ON public.connections;
CREATE TRIGGER avisar_solicitud
AFTER INSERT ON public.connections
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notificar_por_email('notify-connection');

-- El voluntario acepta → se avisa a quien pidió apoyo. Si acepta respondiendo,
-- la propia función se calla: el correo del mensaje ya cuenta lo mismo.
DROP TRIGGER IF EXISTS avisar_aceptacion ON public.connections;
CREATE TRIGGER avisar_aceptacion
AFTER UPDATE ON public.connections
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted')
EXECUTE FUNCTION public.notificar_por_email('notify-connection');
