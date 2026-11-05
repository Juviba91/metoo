-- Preguntas de las guías, sin dar por hecho un hospital.
--
-- Las guías ya son por tema y no por hospital, y hay experiencias que no pasan
-- en uno (un duelo, el Alzheimer, un diagnóstico que se vive en casa). Las
-- preguntas decían «¿a quién del hospital…?», «cómo funciona aquí», «si hay
-- sala»: invitaban a contar cosas de un hospital concreto, que no sirven a
-- quien lee desde otro y que además identifican.
--
-- Solo cambia el texto: las preguntas conservan su id y su orden, así que lo
-- que se escriba a partir de ahora cuelga de ellas sin tocar nada más.
--
-- Idempotente: se localiza cada pregunta por su texto actual o por el nuevo.

-- ─── las 7 generales (las de todos los temas) ─────────────────────────────

UPDATE public.guia_preguntas q
   SET enunciado = v.enunciado, ayuda = v.ayuda
  FROM (VALUES
    (1, 'Lo primero que agradecerías saber al empezar',
        'Por dónde empezar, a quién preguntar, qué pasa los primeros días.'),
    (2, '¿A quién puedes pedir ayuda?',
        'Por su función, nunca por su nombre: trabajo social, psicología, asociaciones, tu médico de familia.'),
    (3, 'Trámites, papeles y ayudas que nadie te explica',
        'Bajas, permisos, ayudas, informes. Dónde se piden y cuánto tardan.'),
    (4, 'Lo práctico del día a día',
        'Qué llevar, cómo organizarte, dónde descansar o comer. Lo pequeño y concreto que nadie cuenta.'),
    (5, 'Cómo cuidarte tú y a quienes te rodean',
        'Pareja, hermanos, familia: cómo os apoyasteis y qué os ayudó.'),
    (6, 'Algo que te ayudó y no esperabas',
        'Una rutina, una frase, algo que hiciste y que te sostuvo.'),
    (7, 'Lo que le dirías a alguien que acaba de empezar',
        'Con tus palabras, como se lo dirías a un amigo.')
  ) AS v(orden, enunciado, ayuda)
 WHERE q.hashtag_id IS NULL AND q.orden = v.orden;

-- ─── las de cada tema: fuera «aquí» y «hospital» ──────────────────────────
-- Se localizan por su texto de antes; el mismo texto está repetido en varios
-- temas y todos cambian igual.

UPDATE public.guia_preguntas q
   SET enunciado = v.nuevo_enunciado, ayuda = v.nueva_ayuda
  FROM (VALUES
    ('Lactancia y sacaleches',
     'Si hay sala, si prestan, dónde guardar la leche, horarios.',
     'Lactancia y sacaleches',
     'Cómo lo resolviste: sacaleches, cómo conservar y llevar la leche, horarios.'),
    ('Método canguro',
     'Cómo funciona aquí, cuánto tiempo, si el acompañante también puede.',
     'Método canguro',
     'Cómo fue, cuánto tiempo al día, si el acompañante también puede.'),
    ('El hospital de día y las sesiones',
     'Cuánto duran, si puedes ir acompañado, qué llevar para pasar las horas.',
     'Las sesiones de tratamiento',
     'Cuánto duran, si puedes ir acompañado, qué llevar para pasar las horas.'),
    ('Acompañar en el hospital de día y en los ingresos',
     'Si puedes entrar, cuánto tiempo, dónde esperar, qué llevar para las horas.',
     'Acompañar durante las sesiones y los ingresos',
     'Si puedes entrar, cuánto tiempo, dónde esperar, qué llevar para las horas.'),
    ('Después de la operación: UCI o planta',
     'Dónde te llevan, visitas, cuánto tiempo, cómo informan a la familia.',
     'Después de la operación',
     'Cómo fueron los primeros días, las visitas, cuánto tiempo, cómo informan a la familia.'),
    ('La despedida en el hospital',
     'Tiempo para estar con tu hijo, recuerdos, si pudo venir la familia. Cómo se pide.',
     'La despedida',
     'Tiempo para estar con tu hijo, recuerdos, si pudo venir la familia. Cómo se pide.'),
    ('La despedida en el hospital',
     'Tiempo para estar con tu bebé, recuerdos, si pudo venir la familia. Cómo se pide.',
     'La despedida',
     'Tiempo para estar con tu bebé, recuerdos, si pudo venir la familia. Cómo se pide.'),
    ('Los trámites tras el fallecimiento',
     'Funeraria, registro, papeles del hospital. Quién te orientó y por dónde empezar.',
     'Los trámites tras el fallecimiento',
     'Funeraria, registro, papeles. Quién te orientó y por dónde empezar.'),
    ('Apoyo después de salir del hospital',
     'Psicología, grupos de duelo, asociaciones. Cómo llegaste a ellos.',
     'Apoyo después',
     'Psicología, grupos de duelo, asociaciones. Cómo llegaste a ellos.'),
    ('Apoyo después de salir del hospital',
     'Psicología perinatal, grupos de duelo, asociaciones. Cómo llegaste a ellos.',
     'Apoyo después',
     'Psicología perinatal, grupos de duelo, asociaciones. Cómo llegaste a ellos.'),
    ('Si te ingresan antes del parto',
     'Cómo es la planta, los monitores, las visitas, qué llevar para días o semanas.',
     'Si te ingresan antes del parto',
     'Cómo fue el ingreso, los monitores, las visitas, qué llevar para días o semanas.'),
    ('Los días de ingreso en planta',
     'Habitación, visitas, quién te ayuda, si el bebé se queda contigo.',
     'Los días de ingreso',
     'Habitación, visitas, quién te ayuda, si el bebé se queda contigo.'),
    ('Colegio y juego en el hospital',
     'Aula hospitalaria, voluntariado, lo que le ayudaba a pasar los días.',
     'Colegio y juego durante el ingreso',
     'Aula hospitalaria, voluntariado, lo que le ayudaba a pasar los días.'),
    ('Los primeros días en la unidad',
     'Visitas, cómo informan a la familia, a quién preguntar.',
     'Los primeros días',
     'Visitas, cómo informan a la familia, a quién preguntar.'),
    ('Dos bebés a la vez: la logística',
     'Si están juntos, cómo os organizasteis con dos, qué pedir al hospital.',
     'Dos bebés a la vez: la logística',
     'Si están juntos, cómo os organizasteis con dos, qué pedir.')
  ) AS v(viejo_enunciado, vieja_ayuda, nuevo_enunciado, nueva_ayuda)
 WHERE q.hashtag_id IS NOT NULL
   AND q.enunciado = v.viejo_enunciado
   AND q.ayuda = v.vieja_ayuda;

-- ─── lo escrito hasta ahora, oculto ───────────────────────────────────────
-- Las 7 respuestas que había hablaban de un hospital concreto y de sus
-- cosas (una sala, un aparcamiento, «cero visitas»). En una guía general, con
-- lectores de otros hospitales, confunden. Se ocultan, no se borran: se pueden
-- volver a mostrar desde el panel de admin.

UPDATE public.guia_respuestas
   SET oculta = true,
       oculta_motivo = 'Habla de un hospital concreto; las guías ya son generales'
 WHERE NOT oculta
   AND hospital_id IS NOT NULL;
