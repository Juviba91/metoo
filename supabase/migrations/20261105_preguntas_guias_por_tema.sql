-- Preguntas propias para los temas que no tenían.
--
-- Hasta ahora solo los temas neonatales (prematuros, UCI neonatal, CIR…)
-- tenían preguntas propias, además de las 7 generales. Una voluntaria de
-- «Pérdida de embarazo» o «Trasplante» abría su guía y solo veía preguntas de
-- estancia genérica, sin nada de lo que de verdad le habría servido a ella.
--
-- Las preguntas piden experiencia práctica, nunca consejo médico: dónde, cómo,
-- a quién preguntar. Las de duelo hablan de despedida y trámites con el mismo
-- tacto que el resto de la app.
--
-- Idempotente: no repite una pregunta que ya exista para ese tema.

INSERT INTO public.guia_preguntas (hashtag_id, orden, enunciado, ayuda)
SELECT h.id, v.orden, v.enunciado, v.ayuda
  FROM (VALUES
    -- Embarazo de riesgo
    ('embarazo-riesgo', 8, 'Las consultas y pruebas de alto riesgo',
     'Cada cuánto, cuánto se espera, si puedes ir acompañada, qué preguntar.'),
    ('embarazo-riesgo', 9, 'Si te ingresan antes del parto',
     'Cómo es la planta, los monitores, las visitas, qué llevar para días o semanas.'),
    ('embarazo-riesgo', 10, 'Reposo, baja y trabajo',
     'Cómo se pidió la baja, quién la firma, qué te dijeron del reposo.'),

    -- Parto difícil
    ('parto-dificil', 8, 'Si el parto se complica: qué pasa y dónde está tu acompañante',
     'Quirófano, cesárea urgente, si puede entrar alguien contigo, dónde espera.'),
    ('parto-dificil', 9, 'Los días en la planta de maternidad',
     'Habitación, visitas, ayuda con la lactancia, si el bebé se queda contigo.'),
    ('parto-dificil', 10, 'Después del alta: revisiones y recuperación',
     'Matrona, suelo pélvico, a quién llamar si algo no va bien.'),

    -- Pérdida de embarazo
    ('perdida-embarazo', 8, 'Dónde te atienden y cómo',
     'Urgencias de maternidad o de ginecología, si esperas junto a otras embarazadas, si puedes estar acompañada.'),
    ('perdida-embarazo', 9, 'Cómo te explicaron las opciones',
     'Esperar, medicación o intervención: cómo te lo contaron y qué te habría gustado saber. Tu experiencia, no consejos médicos.'),
    ('perdida-embarazo', 10, 'Despedirse y guardar recuerdos',
     'Si te ofrecieron ver al bebé, huellas, fotos o una caja de recuerdos. Cómo se pide.'),
    ('perdida-embarazo', 11, 'Papeles y baja después de una pérdida',
     'Qué baja te correspondió, quién te orientó, qué trámites hubo que hacer.'),

    -- Duelo por un hijo y muerte neonatal
    ('duelo-hijo', 8, 'La despedida en el hospital',
     'Tiempo para estar con tu hijo, recuerdos, si pudo venir la familia. Cómo se pide.'),
    ('duelo-hijo', 9, 'Los trámites tras el fallecimiento',
     'Funeraria, registro, papeles del hospital. Quién te orientó y por dónde empezar.'),
    ('duelo-hijo', 10, 'Apoyo después de salir del hospital',
     'Psicología, grupos de duelo, asociaciones. Cómo llegaste a ellos.'),
    ('muerte-neonatal', 8, 'La despedida en el hospital',
     'Tiempo para estar con tu bebé, recuerdos, si pudo venir la familia. Cómo se pide.'),
    ('muerte-neonatal', 9, 'Los trámites tras el fallecimiento',
     'Funeraria, registro, papeles del hospital. Quién te orientó y por dónde empezar.'),
    ('muerte-neonatal', 10, 'Apoyo después de salir del hospital',
     'Psicología perinatal, grupos de duelo, asociaciones. Cómo llegaste a ellos.'),

    -- Trasplante
    ('trasplante', 8, 'La lista de espera',
     'Cómo te avisan, qué tener preparado, cuánto margen hay para llegar.'),
    ('trasplante', 9, 'Si vienes de fuera: dónde alojarte',
     'Pisos de asociaciones, alojamientos con convenio, ayudas para el desplazamiento.'),
    ('trasplante', 10, 'Después del trasplante: revisiones y día a día',
     'Cada cuánto son las consultas, la medicación, el aislamiento, la vuelta a casa.'),

    -- Cáncer, cáncer en familia y quimioterapia
    ('cancer', 8, 'El hospital de día y las sesiones',
     'Cuánto duran, si puedes ir acompañado, qué llevar para pasar las horas.'),
    ('cancer', 9, 'Efectos y cuidados: lo práctico',
     'Dónde conseguir pañuelos o pelucas, cremas, a quién llamar si hay fiebre. Tu experiencia, no consejos médicos.'),
    ('cancer', 10, 'Apoyo y asociaciones que te ayudaron',
     'Psicooncología, trabajo social, asociaciones de pacientes y de familias.'),
    ('quimioterapia', 8, 'El hospital de día y las sesiones',
     'Cuánto duran, si puedes ir acompañado, qué llevar para pasar las horas.'),
    ('quimioterapia', 9, 'Efectos y cuidados: lo práctico',
     'Dónde conseguir pañuelos o pelucas, cremas, a quién llamar si hay fiebre. Tu experiencia, no consejos médicos.'),
    ('cancer-en-familia', 8, 'Acompañar en el hospital de día y en los ingresos',
     'Si puedes entrar, cuánto tiempo, dónde esperar, qué llevar para las horas.'),
    ('cancer-en-familia', 9, 'Apoyo para la familia',
     'Psicooncología, trabajo social, asociaciones. También para quien cuida.'),

    -- UCI pediátrica e hijo enfermo
    ('uci-pediatrica', 8, 'Quedarte con tu hijo: dormir y turnos',
     'Si puedes quedarte por la noche, dónde, cómo os organizasteis los turnos.'),
    ('uci-pediatrica', 9, 'Los hermanos y el resto de la familia',
     'Si pueden entrar, cómo se lo explicasteis, quién os ayudó.'),
    ('hijo-enfermo', 8, 'Quedarte con tu hijo: dormir y turnos',
     'Si puedes quedarte por la noche, dónde, cómo os organizasteis los turnos.'),
    ('hijo-enfermo', 9, 'Los hermanos y el resto de la familia',
     'Si pueden entrar, cómo se lo explicasteis, quién os ayudó.'),
    ('hijo-enfermo', 10, 'Colegio y juego en el hospital',
     'Aula hospitalaria, voluntariado, lo que le ayudaba a pasar los días.'),

    -- Ictus e infarto
    ('ictus', 8, 'Los primeros días en la unidad de ictus',
     'Visitas, cómo informan a la familia, a quién preguntar.'),
    ('ictus', 9, 'Rehabilitación',
     'Fisioterapia, logopedia: cuándo empieza, dónde, cuánto se espera.'),
    ('ictus', 10, 'Volver a casa',
     'Qué adaptar, qué ayudas pedir, a quién llamar si algo cambia.'),
    ('infarto', 8, 'Los primeros días en la unidad coronaria',
     'Visitas, cómo informan a la familia, a quién preguntar.'),
    ('infarto', 9, 'Rehabilitación cardíaca',
     'Si te la ofrecieron, cuándo empieza, dónde, cuánto se espera.'),
    ('infarto', 10, 'Volver a casa',
     'Qué cambiar en el día a día, revisiones, a quién llamar si algo no va bien.'),

    -- Gemelos
    ('gemelos', 8, 'Lactancia y sacaleches',
     'Si hay sala, si prestan, dónde guardar la leche, horarios.'),
    ('gemelos', 9, 'Dos bebés a la vez: la logística',
     'Si están juntos, cómo os organizasteis con dos, qué pedir al hospital.'),
    ('gemelos-prematuros', 10, 'Dos bebés a la vez: la logística',
     'Si están juntos o en salas distintas, cómo os organizasteis con dos.')
  ) AS v(slug, orden, enunciado, ayuda)
  JOIN public.hashtags h ON h.slug = v.slug
 WHERE NOT EXISTS (
   SELECT 1 FROM public.guia_preguntas q
    WHERE q.hashtag_id = h.id AND q.enunciado = v.enunciado
 );
