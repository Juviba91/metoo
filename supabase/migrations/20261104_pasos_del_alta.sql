-- En qué paso del alta se queda la gente.
--
-- De 12 cuentas, 3 confirmaron el correo, abrieron el asistente y lo dejaron,
-- y no había forma de saber en qué pantalla. Los eventos de Vercel Analytics
-- son de pago, así que se guarda aquí: el paso más lejano al que llegó cada
-- cuenta que aún no tiene perfil.
--
-- Solo vive mientras no hay perfil: al crearlo, el disparador borra la fila.
-- Así la tabla contiene exactamente a quien se quedó a medias, y nada de
-- quien ya está dentro (no hace falta tocar `eliminar_mi_cuenta`). Cuelga de
-- auth.users con ON DELETE CASCADE, no de profiles.
--
-- Sin políticas: la escribe solo `marcar_paso_alta` y la lee solo el admin.

CREATE TABLE IF NOT EXISTS public.alta_pasos (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  paso smallint NOT NULL,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alta_pasos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.alta_pasos FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.marcar_paso_alta(p_paso integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO alta_pasos (user_id, paso)
  SELECT auth.uid(), p_paso
   WHERE auth.uid() IS NOT NULL
     AND p_paso BETWEEN 1 AND 5
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  ON CONFLICT (user_id) DO UPDATE
    SET paso = greatest(alta_pasos.paso, excluded.paso),
        actualizado_en = now();
$$;

REVOKE ALL ON FUNCTION public.marcar_paso_alta(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.marcar_paso_alta(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.olvidar_paso_alta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM alta_pasos WHERE user_id = NEW.id;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.olvidar_paso_alta() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_olvidar_paso_alta ON public.profiles;
CREATE TRIGGER profiles_olvidar_paso_alta
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.olvidar_paso_alta();
