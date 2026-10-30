-- Un correo por tanda de mensajes, no uno por mensaje.
--
-- Cada mensaje nuevo disparaba un correo («X te ha enviado un mensaje»): diez
-- mensajes seguidos eran diez correos. Ahora solo se avisa del PRIMERO que no
-- has leído. Mientras sigas sin abrir la conversación, los siguientes no
-- mandan nada: el correo que ya tienes dice lo mismo. Cuando la abres (se
-- actualiza `*_last_read_at`), el siguiente mensaje vuelve a avisar.
--
-- Y si pasan 12 horas sin que la abras, el siguiente mensaje sí avisa otra vez:
-- un recordatorio, por si el primer correo se perdió.
--
-- Sustituye el trigger `avisar_mensaje_nuevo` de 20260907, que llamaba a
-- `notificar_por_email('notify-message')` sin condiciones. La función de
-- Supabase `notify-message` no cambia: esto decide CUÁNDO se la llama.

CREATE OR REPLACE FUNCTION public.avisar_mensaje_agrupado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_conn record;
  v_leido timestamptz;
  v_url text;
  v_anon text;
BEGIN
  SELECT seeker_id, volunteer_id, seeker_last_read_at, volunteer_last_read_at
    INTO v_conn
    FROM connections WHERE id = NEW.connection_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Lo último que leyó quien recibe el mensaje.
  v_leido := CASE WHEN NEW.sender_id = v_conn.seeker_id
                  THEN v_conn.volunteer_last_read_at
                  ELSE v_conn.seeker_last_read_at END;

  -- ¿Ya hay un mensaje suyo sin leer de las últimas 12 horas? Entonces ya
  -- se avisó por correo de esta tanda.
  IF EXISTS (
    SELECT 1 FROM messages m
     WHERE m.connection_id = NEW.connection_id
       AND m.sender_id = NEW.sender_id
       AND m.id <> NEW.id
       AND m.created_at <= NEW.created_at
       AND m.created_at > coalesce(v_leido, '-infinity'::timestamptz)
       AND m.created_at > now() - interval '12 hours'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_anon FROM vault.decrypted_secrets WHERE name = 'anon_key';
  IF v_url IS NULL OR v_anon IS NULL THEN
    RAISE NOTICE 'avisar_mensaje_agrupado: falta project_url o anon_key en Vault';
    RETURN NULL;
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/notify-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(NEW),
      'old_record', NULL::jsonb
    ),
    timeout_milliseconds := 10000
  );

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.avisar_mensaje_agrupado() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS avisar_mensaje_nuevo ON public.messages;
CREATE TRIGGER avisar_mensaje_nuevo
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.avisar_mensaje_agrupado();
