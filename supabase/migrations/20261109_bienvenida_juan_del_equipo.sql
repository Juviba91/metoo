-- La bienvenida dice «soy Juan, del Equipo de metoo» en vez de «soy Juan, de
-- metoo». Juan quiere que se vea que escribe el equipo, no una persona más de
-- la comunidad: en el resto de chats escribe quien busca apoyo.
--
-- Solo cambia el texto de la función; el trigger sigue siendo el mismo.

CREATE OR REPLACE FUNCTION public.bienvenida_equipo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL OR EXISTS (SELECT 1 FROM mensajes_equipo WHERE usuario_id = NEW.id) THEN
    RETURN NULL;
  END IF;

  INSERT INTO mensajes_equipo (usuario_id, del_equipo, contenido, automatico)
  VALUES (
    NEW.id,
    true,
    CASE WHEN NEW.role = 'volunteer' THEN
      E'Hola, soy Juan, del Equipo de metoo. Gracias por querer acompañar a quien lo necesita.\n\n'
      || E'No tienes que hacer nada más ahora: cuando alguien te escriba, te llegará un aviso. '
      || E'Si quieres ayudar ya, en Inicio → Guías puedes escribir la guía de tu hospital: '
      || E'la lee gente que acaba de llegar y no sabe por dónde empezar.\n\n'
      || E'Si tienes cualquier duda o idea, escríbeme aquí.'
    ELSE
      E'Hola, soy Juan, del Equipo de metoo. Me alegra que estés aquí.\n\n'
      || E'No tienes que contar nada que no quieras. Si te apetece, en Inicio puedes ver a personas '
      || E'que ya pasaron por algo parecido y escribirles un «hola». Y si prefieres, cuéntame aquí '
      || E'qué te está pasando y te digo con quién puede encajar hablar.\n\n'
      || E'Si es urgente, el 024 atiende gratis las 24 horas y, en una emergencia, el 112.'
    END,
    true
  );

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.bienvenida_equipo() FROM PUBLIC, anon, authenticated;
