-- El alias de quien escribe se ve siempre, y se puede pulsar.
--
-- Decisión de producto: el alias es un seudónimo, y poder ver quién dice algo
-- es parte de poder valorarlo. Se revierte la firma opcional de ayer.
--
-- Dos cambios en la vista:
--
-- · `autor_alias` sin condición. La columna `mostrar_alias` se queda en la
--   tabla (no molesta, y borrarla perdería el dato de quién había marcado qué)
--   pero deja de filtrar.
--
-- · `autor_id` pasa a salir, porque sin él no se puede enlazar al perfil. No
--   añade exposición sobre lo que ya hay: con el alias visible, a esa persona
--   se la encuentra igual desde la búsqueda de la app.
--
-- Si la cuenta se dio de baja, `autor_id` queda a NULL y el alias también: la
-- aportación se sigue viendo, sin nombre y sin enlace.

CREATE OR REPLACE VIEW public.guias_publicas AS
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
         a.role AS autor_rol,
         a.alias AS autor_alias,
         r.autor_id
    FROM public.guia_respuestas r
    JOIN public.hospitals h ON h.id = r.hospital_id
    JOIN public.hashtags t ON t.id = r.hashtag_id
    JOIN public.guia_preguntas p ON p.id = r.pregunta_id
    LEFT JOIN public.profiles a ON a.id = r.autor_id
   WHERE NOT r.oculta;

GRANT SELECT ON public.guias_publicas TO anon, authenticated;

-- «LaPaz» no es un tema, es un hospital, y ahora el hospital es un campo de
-- verdad con su propio selector. Como etiqueta solo confundía: daría una guía
-- de (hospital = la-paz, tema = lapaz), que no significa nada.
-- El ON DELETE CASCADE de `profile_hashtags` lo quita de los perfiles solo.
DELETE FROM public.hashtags WHERE slug = 'lapaz';
