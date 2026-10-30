-- Cuántas personas acompañan en cada tema, para enseñarlo ANTES de registrarse.
--
-- Hasta ahora había que crear la cuenta y rellenar cinco pasos de perfil para
-- descubrir si en tu tema había alguien. Esto devuelve solo recuentos por tema
-- —ningún alias, perfil ni ciudad— y por eso se puede leer sin cuenta: las
-- fichas siguen viéndose solo con sesión y por el lado contrario.
--
-- Cuenta a quien acompaña en ese tema (`profile_hashtags.role`), disponible y
-- sin dar de baja, y deja fuera las cuentas de prueba (@test.local): en
-- público, un número inflado sería engañar a quien llega.

CREATE OR REPLACE FUNCTION public.voluntarios_por_tema()
RETURNS TABLE(slug text, label text, voluntarios integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT h.slug, h.label, count(DISTINCT p.id)::int
    FROM hashtags h
    JOIN profile_hashtags ph ON ph.hashtag_id = h.id AND ph.role = 'volunteer'
    JOIN profiles p ON p.id = ph.profile_id AND p.is_active AND p.deleted_at IS NULL
    JOIN auth.users u ON u.id = p.id AND u.email NOT LIKE '%@test.local'
   GROUP BY h.slug, h.label
   ORDER BY 3 DESC, h.label
$$;

REVOKE ALL ON FUNCTION public.voluntarios_por_tema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.voluntarios_por_tema() TO anon, authenticated;
