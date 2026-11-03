-- Preguntas de las guías: más generales, para que valgan a más casos, y los
-- temas que aún no tenían ninguna propia.
--
-- Juan: «que no sean súper específicas para que se puedan extrapolar». Las de
-- 20261105 nombraban la unidad o la técnica («unidad coronaria»,
-- «rehabilitación cardíaca», «si el parto se complica»). Una persona con otra
-- variante del mismo problema no se veía en ellas. Se dejan en lo que
-- comparten: los primeros días, la rehabilitación, si algo se complica.
--
-- Y temas que solo tenían las 7 generales, de estancia en hospital, aunque el
-- día a día va por otro sitio: Alzheimer en familia (cuidar en casa), muerte
-- de un abuelo (despedida, trámites), cirugía mayor, enfermedad rara y
-- diagnóstico reciente.
--
-- Idempotente: los UPDATE solo tocan el texto antiguo exacto y los INSERT no
-- repiten una pregunta que ya exista para ese tema.

-- ─── 1. Más generales ─────────────────────────────────────────────────────

UPDATE public.guia_preguntas
   SET enunciado = 'Los primeros días en la unidad',
       ayuda = 'Visitas, cómo informan a la familia, a quién preguntar.'
 WHERE enunciado IN ('Los primeros días en la unidad de ictus', 'Los primeros días en la unidad coronaria');

UPDATE public.guia_preguntas
   SET enunciado = 'Rehabilitación',
       ayuda = 'Qué te ofrecieron (fisioterapia, logopedia u otra), cuándo empieza, dónde, cuánto se espera.'
 WHERE enunciado IN ('Rehabilitación', 'Rehabilitación cardíaca');

UPDATE public.guia_preguntas
   SET enunciado = 'Si algo se complica: qué pasa y dónde queda tu acompañante',
       ayuda = 'Quirófano, urgencias, si puede entrar alguien contigo, dónde espera.'
 WHERE enunciado = 'Si el parto se complica: qué pasa y dónde está tu acompañante';

UPDATE public.guia_preguntas
   SET enunciado = 'Los días de ingreso en planta',
       ayuda = 'Habitación, visitas, quién te ayuda, si el bebé se queda contigo.'
 WHERE enunciado = 'Los días en la planta de maternidad';

UPDATE public.guia_preguntas
   SET enunciado = 'Dónde alojarse si vienes de fuera',
       ayuda = 'Pisos de asociaciones, alojamientos con convenio, ayudas para el desplazamiento.'
 WHERE enunciado = 'Si vienes de fuera: dónde alojarte';

UPDATE public.guia_preguntas
   SET enunciado = 'Después: revisiones y día a día',
       ayuda = 'Cada cuánto son las consultas, la medicación, los cuidados, la vuelta a casa.'
 WHERE enunciado = 'Después del trasplante: revisiones y día a día';

-- ─── 2. Temas que no tenían preguntas propias ─────────────────────────────

INSERT INTO public.guia_preguntas (hashtag_id, orden, enunciado, ayuda)
SELECT h.id, v.orden, v.enunciado, v.ayuda
  FROM (VALUES
    -- Cuidar a alguien con una enfermedad larga
    ('alzheimer-familiar', 8, 'A quién acudir tras el diagnóstico',
     'Neurología, centro de salud, trabajo social: quién te orientó y qué pedir.'),
    ('alzheimer-familiar', 9, 'Ayudas y recursos para cuidar',
     'Dependencia, centro de día, respiro familiar: cómo se piden y cuánto tardan.'),
    ('alzheimer-familiar', 10, 'Cuidar también de ti',
     'Asociaciones, grupos de familiares, lo que te dio aire.'),

    -- Muerte de alguien cercano
    ('muerte-abuelo-cercano', 8, 'La despedida',
     'Si pudisteis estar con él o con ella, cuidados paliativos, cómo os organizasteis.'),
    ('muerte-abuelo-cercano', 9, 'Los trámites tras el fallecimiento',
     'Funeraria, registro, papeles del hospital. Quién te orientó y por dónde empezar.'),
    ('muerte-abuelo-cercano', 10, 'Apoyo después de la pérdida',
     'Psicología, grupos de duelo, asociaciones. Cómo llegaste a ellos.'),

    -- Una operación importante
    ('cirugia-mayor', 8, 'Antes de la operación',
     'Preoperatorio, pruebas, papeles, qué te pidieron llevar.'),
    ('cirugia-mayor', 9, 'Después de la operación: UCI o planta',
     'Dónde te llevan, visitas, cuánto tiempo, cómo informan a la familia.'),
    ('cirugia-mayor', 10, 'Volver a casa',
     'Qué adaptar, qué ayudas pedir, a quién llamar si algo cambia.'),

    -- Diagnósticos difíciles
    ('enfermedad-rara', 8, 'Llegar al especialista o a la unidad de referencia',
     'Cómo llegaste, derivaciones, segundas opiniones, cuánto se tardó.'),
    ('enfermedad-rara', 9, 'Apoyo y asociaciones que te ayudaron',
     'Asociaciones de pacientes y de familias, trabajo social, otras familias.'),
    ('diagnostico-reciente', 8, 'Las primeras consultas: qué preguntar',
     'Lo que te habría gustado preguntar, si puedes ir acompañado, cómo pedir los informes.'),
    ('diagnostico-reciente', 9, 'Apoyo y asociaciones que te ayudaron',
     'Asociaciones de pacientes y de familias, trabajo social, psicología.')
  ) AS v(slug, orden, enunciado, ayuda)
  JOIN public.hashtags h ON h.slug = v.slug
 WHERE NOT EXISTS (
   SELECT 1 FROM public.guia_preguntas q
    WHERE q.hashtag_id = h.id AND q.enunciado = v.enunciado
 );
