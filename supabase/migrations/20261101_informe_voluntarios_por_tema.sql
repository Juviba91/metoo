-- Para Juan: quién acompaña en qué tema, para mirarlo desde el panel de
-- Supabase (Table Editor → esquema «informes») o con un SELECT.
--
-- En un esquema aparte a propósito: PostgREST solo expone `public`, así que
-- nada de esto se puede leer con la clave pública de la app. Sin GRANT a anon
-- ni a authenticated: solo lo ve quien entra al panel o a la base.
--
-- El papel es el del TEMA (`profile_hashtags.role`), no el de la cuenta: una
-- cuenta registrada buscando apoyo puede acompañar en otro tema.

CREATE SCHEMA IF NOT EXISTS informes;
REVOKE ALL ON SCHEMA informes FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE VIEW informes.voluntarios_por_tema AS
  SELECT h.label AS tema,
         p.alias,
         u.email,
         p.city AS ciudad,
         p.is_active AS disponible,
         p.created_at AS registrado,
         u.last_sign_in_at AS ultima_entrada,
         (u.email LIKE '%@test.local') AS cuenta_de_prueba
    FROM profile_hashtags ph
    JOIN hashtags h ON h.id = ph.hashtag_id
    JOIN profiles p ON p.id = ph.profile_id AND p.deleted_at IS NULL
    JOIN auth.users u ON u.id = p.id
   WHERE ph.role = 'volunteer'
   ORDER BY h.label, p.alias;

-- Y el resumen: cuántas personas acompañan en cada tema, sin contar pruebas.
CREATE OR REPLACE VIEW informes.resumen_por_tema AS
  SELECT h.label AS tema,
         count(DISTINCT ph.profile_id) FILTER (WHERE ph.role = 'volunteer' AND p.is_active) AS acompanan_disponibles,
         count(DISTINCT ph.profile_id) FILTER (WHERE ph.role = 'volunteer') AS acompanan_total,
         count(DISTINCT ph.profile_id) FILTER (WHERE ph.role = 'seeker') AS buscan_apoyo
    FROM hashtags h
    LEFT JOIN profile_hashtags ph ON ph.hashtag_id = h.id
    LEFT JOIN profiles p ON p.id = ph.profile_id AND p.deleted_at IS NULL
    LEFT JOIN auth.users u ON u.id = p.id
   WHERE p.id IS NULL OR u.email NOT LIKE '%@test.local'
   GROUP BY h.label
  HAVING count(ph.profile_id) > 0
   ORDER BY 2 DESC, 4 DESC, 1;

REVOKE ALL ON ALL TABLES IN SCHEMA informes FROM anon, authenticated, PUBLIC;
