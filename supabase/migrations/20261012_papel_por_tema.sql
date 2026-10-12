-- El papel va por tema, no por cuenta.
--
-- Una persona puede acompañar en unos temas (los que ya vivió) y buscar apoyo
-- en otros (los que está viviendo). `profiles.role` se queda como el lado con
-- el que se registró; cada fila de `profile_hashtags` dice ahora de qué lado
-- está esa persona en ESE tema. Ver lib/lados.ts.
--
-- Las cuentas que ya existen no cambian: cada tema hereda el papel de su
-- cuenta, así que todos los temas de una cuenta son del mismo lado hasta que
-- su dueña decida otra cosa.
--
-- Tres cosas, en este orden a propósito:
--
-- 1. LA COLUMNA, con un trigger que rellena el papel cuando quien inserta no
--    lo manda. El registro (onboarding) sigue insertando `{profile_id,
--    hashtag_id}` sin saber que la columna existe, y una pestaña abierta con el
--    código de antes de este cambio también: sin el trigger, sus inserciones
--    fallarían contra el NOT NULL.
--
-- 2. LA POLÍTICA DE UPDATE. `profile_hashtags` tiene permiso de UPDATE pero
--    NINGUNA política de UPDATE (solo SELECT, INSERT e DELETE, comprobado el
--    2026-10-12), y con RLS eso significa que cualquier UPDATE se rechaza en
--    silencio: cambiar el papel de un tema que ya tenías no habría guardado
--    nada. Solo sobre las filas propias.
--
-- 3. NOT NULL y CHECK, al final, cuando todas las filas ya tienen valor.

ALTER TABLE public.profile_hashtags ADD COLUMN IF NOT EXISTS role text;

CREATE OR REPLACE FUNCTION public.profile_hashtags_rol_por_defecto()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS NULL THEN
    SELECT role INTO NEW.role FROM public.profiles WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profile_hashtags_rol_por_defecto ON public.profile_hashtags;
CREATE TRIGGER profile_hashtags_rol_por_defecto
  BEFORE INSERT ON public.profile_hashtags
  FOR EACH ROW EXECUTE FUNCTION public.profile_hashtags_rol_por_defecto();

UPDATE public.profile_hashtags ph
   SET role = p.role
  FROM public.profiles p
 WHERE p.id = ph.profile_id
   AND ph.role IS NULL;

ALTER TABLE public.profile_hashtags ALTER COLUMN role SET NOT NULL;

ALTER TABLE public.profile_hashtags DROP CONSTRAINT IF EXISTS profile_hashtags_role_check;
ALTER TABLE public.profile_hashtags
  ADD CONSTRAINT profile_hashtags_role_check CHECK (role IN ('seeker', 'volunteer'));

DROP POLICY IF EXISTS profile_hashtags_own_update ON public.profile_hashtags;
CREATE POLICY profile_hashtags_own_update ON public.profile_hashtags
  FOR UPDATE TO authenticated
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));
