-- Quién escribió cada cosa: si lo está viviendo o si ya pasó por ahí.
--
-- Es contexto que el lector necesita. Una respuesta de alguien ingresado ahora y
-- otra de alguien que salió hace tres años valen distinto, y hasta ahora se
-- leían igual.
--
-- El rol NO identifica: son dos valores para toda la app. Es lo contrario del
-- alias, que es un identificador persistente y el mismo que se usa en el feed y
-- en las búsquedas.
--
-- Si la cuenta se dio de baja, `autor_id` queda a NULL y el rol sale NULL: la
-- aportación se sigue viendo, sin etiqueta.

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
         a.role AS autor_rol
    FROM public.guia_respuestas r
    JOIN public.hospitals h ON h.id = r.hospital_id
    JOIN public.hashtags t ON t.id = r.hashtag_id
    JOIN public.guia_preguntas p ON p.id = r.pregunta_id
    LEFT JOIN public.profiles a ON a.id = r.autor_id
   WHERE NOT r.oculta;

GRANT SELECT ON public.guias_publicas TO anon, authenticated;
