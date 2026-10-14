-- Lo urgente de la nota legal de octubre de 2026 (Mas Calvet), en la base.
--
-- 1. LAS GUÍAS DEJAN DE LLEVAR FIRMA (medida U-3).
--
--    `guias_publicas` servía el alias y el id de quien escribía, y la página lo
--    enlazaba a su perfil. Un alias + un hospital + un tema de salud + si lo
--    está viviendo, en un hospital pequeño, identifica a una persona y revela
--    su salud a cualquiera, sin cuenta. Se quitan las dos columnas de la
--    VISTA, no solo de la página: la vista se lee con la clave pública, así
--    que esconderlas en el HTML no las protegía.
--
--    CREATE OR REPLACE VIEW no puede quitar columnas: hay que borrarla y
--    crearla otra vez. No depende nada de ella.
--
--    `autor_rol` pasa a salir del papel en ESE tema (profile_hashtags.role),
--    porque una misma cuenta puede haber vivido un tema y estar viviendo otro.
--    Si ya no tiene el tema en el perfil, se usa el de la cuenta. Si la cuenta
--    se dio de baja (autor_id NULL), no sale nada.
--
-- 2. CONSENTIMIENTO DE SALUD Y EDAD, POR SEPARADO (medidas U-1, U-2 e I-10).
--
--    El de salud ya era una casilla aparte, pero se guardaba con la misma
--    fecha que la aceptación de los textos. Ahora tiene sus columnas. La edad
--    se comprueba con la fecha de nacimiento, que NO se guarda: solo cuándo
--    se superó la comprobación.
--
--    Las cuentas anteriores no tienen nada de esto, y el consentimiento no es
--    retroactivo: la app les pide renovarlo en su siguiente visita
--    (`renovar_consentimiento`), con la fecha de nacimiento.
--
-- 3. LAS CONVERSACIONES DE QUIEN SE VA SE BORRAN AL AÑO (medida U-7).
--
--    Al darse de baja, a la otra persona le queda el hilo. Era sin plazo; ahora
--    es un año desde la baja, y luego se borra entero (la conversación y sus
--    mensajes, por el ON DELETE CASCADE de `messages`). Un reporte que apunte a
--    esa conversación se queda sin ella (`reports.connection_id` es SET NULL).

-- 1 ────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.guias_publicas;

CREATE VIEW public.guias_publicas AS
  SELECT r.id,
         h.slug AS hospital_slug,
         h.name AS hospital,
         h.city AS ciudad,
         t.slug AS tema_slug,
         t.label AS tema,
         p.id AS pregunta_id,
         p.orden,
         p.enunciado,
         p.ayuda,
         r.contenido,
         r.revisada_en,
         CASE WHEN r.autor_id IS NULL THEN NULL
              ELSE coalesce(ph.role, a.role) END AS autor_rol
    FROM public.guia_respuestas r
    JOIN public.hospitals h ON h.id = r.hospital_id
    JOIN public.hashtags t ON t.id = r.hashtag_id
    JOIN public.guia_preguntas p ON p.id = r.pregunta_id
    LEFT JOIN public.profiles a ON a.id = r.autor_id
    LEFT JOIN public.profile_hashtags ph
           ON ph.profile_id = r.autor_id AND ph.hashtag_id = r.hashtag_id
   WHERE NOT r.oculta;

REVOKE ALL ON public.guias_publicas FROM anon, authenticated;
GRANT SELECT ON public.guias_publicas TO anon, authenticated;

-- 2 ────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consentimiento_salud_en timestamptz,
  ADD COLUMN IF NOT EXISTS consentimiento_salud_version text,
  ADD COLUMN IF NOT EXISTS edad_comprobada_en timestamptz;

-- Como el resto del registro de consentimiento: se escribe al crear la ficha
-- y no se puede reescribir a mano (no hay GRANT de UPDATE). Para renovarlo
-- está la función de abajo.
GRANT INSERT (consentimiento_salud_en, consentimiento_salud_version, edad_comprobada_en)
  ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.renovar_consentimiento(p_version text, p_nacimiento date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF p_version IS NULL OR p_version !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Versión de los textos no válida';
  END IF;

  -- La app ya lo comprueba antes; aquí se repite porque esta función se puede
  -- llamar directamente con la clave pública.
  IF p_nacimiento IS NULL
     OR p_nacimiento > (current_date - interval '16 years')::date
     OR p_nacimiento < (current_date - interval '120 years')::date THEN
    RAISE EXCEPTION 'metoo es para mayores de 16 años';
  END IF;

  UPDATE profiles SET
    consentimiento_en = now(),
    consentimiento_version = p_version,
    consentimiento_salud_en = now(),
    consentimiento_salud_version = p_version,
    edad_comprobada_en = now()
  WHERE id = v_uid AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay perfil';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.renovar_consentimiento(text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renovar_consentimiento(text, date) TO authenticated;

-- 3 ────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.purgar_conversaciones_de_bajas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_filas integer;
BEGIN
  DELETE FROM connections c
   USING profiles p
   WHERE p.deleted_at IS NOT NULL
     AND p.deleted_at < now() - interval '1 year'
     AND (c.seeker_id = p.id OR c.volunteer_id = p.id);

  GET DIAGNOSTICS v_filas = ROW_COUNT;
  RETURN v_filas;
END;
$$;

-- Solo la llama el cron: nadie con sesión tiene por qué poder dispararla.
REVOKE ALL ON FUNCTION public.purgar_conversaciones_de_bajas() FROM PUBLIC, anon, authenticated;

-- Cada noche. Con el mismo nombre, cron.schedule actualiza en vez de duplicar.
SELECT cron.schedule(
  'purgar-conversaciones-bajas',
  '41 3 * * *',
  'SELECT public.purgar_conversaciones_de_bajas()'
);
