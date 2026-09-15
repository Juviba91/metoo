-- El token de baja, fuera de `profiles`.
--
-- Estaba como columna con `REVOKE SELECT (digest_token)`, y eso NO funcionó:
-- en Postgres, revocar una columna suelta no cancela un SELECT concedido sobre
-- la tabla entera, y `authenticated` lo tiene. O sea que cualquiera con sesión
-- podía leer el token de los demás y darles de baja del aviso semanal.
--
-- El arreglo evidente sería revocar la tabla y conceder columna a columna,
-- pero en este proyecto se añaden columnas desde el panel a menudo: cada
-- columna nueva nacería ilegible y daría un error confuso meses después.
--
-- Aquí va a su propia tabla con RLS y sin políticas, que es "nadie". Solo la
-- ven las funciones SECURITY DEFINER y la service role, que es justo quien la
-- necesita. Mismo patrón que `email_queue`.

CREATE TABLE IF NOT EXISTS public.digest_tokens (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid()
);

ALTER TABLE public.digest_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.digest_tokens FROM anon, authenticated;

-- Se conservan los tokens que ya se habían generado, por si alguno viajó ya en
-- un correo.
INSERT INTO public.digest_tokens (profile_id, token)
SELECT id, digest_token FROM public.profiles
ON CONFLICT (profile_id) DO NOTHING;

-- Cada perfil nuevo estrena el suyo.
CREATE OR REPLACE FUNCTION public.crear_token_baja()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO digest_tokens (profile_id) VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS token_baja_al_crear_perfil ON public.profiles;
CREATE TRIGGER token_baja_al_crear_perfil
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.crear_token_baja();

-- Las dos funciones de la página de baja pasan a mirar la tabla nueva.
CREATE OR REPLACE FUNCTION public.resumen_estado(p_token uuid)
RETURNS TABLE (alias text, activo boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.alias, p.digest_enabled
    FROM digest_tokens t
    JOIN profiles p ON p.id = t.profile_id
   WHERE t.token = p_token
$$;

CREATE OR REPLACE FUNCTION public.baja_resumen(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_filas int;
BEGIN
  UPDATE profiles p
     SET digest_enabled = false
    FROM digest_tokens t
   WHERE t.profile_id = p.id AND t.token = p_token;

  GET DIAGNOSTICS v_filas = ROW_COUNT;
  RETURN v_filas > 0;
END;
$$;

-- Y fuera la columna, que es la que se podía leer.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS digest_token;
