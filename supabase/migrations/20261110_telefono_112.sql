-- El 024 es la línea de atención a la CONDUCTA SUICIDA, no un teléfono general
-- de ayuda. Varios textos lo daban como «si es urgente» o «si lo pasas mal»:
-- ahí va el 112. Solo se mantiene el 024 donde se habla expresamente de
-- quitarse la vida (aviso de riesgo del chat, normas, términos).
--
-- Se cambia la frase dentro de la definición viva de cada función en vez de
-- copiarlas enteras: así no se arrastra ninguna versión vieja de lo demás.
-- Se puede ejecutar dos veces sin efecto.

DO $$
DECLARE
  def text;
BEGIN
  -- Bienvenida automática a quien busca apoyo.
  def := pg_get_functiondef('public.bienvenida_equipo()'::regprocedure);
  def := replace(def,
    'Si es urgente, el 024 atiende gratis las 24 horas y, en una emergencia, el 112.',
    'Si es urgente, llama al 112.');
  EXECUTE def;

  -- Correo a quien hace un reporte: ya decía 112 para el peligro; sobraba el 024.
  def := pg_get_functiondef('public.acusar_reporte()'::regprocedure);
  def := replace(def, 'Si eres tú quien lo está pasando mal, el <strong>024</strong> ', '');
  def := replace(def, '''atiende gratis las 24 horas.</p>''', '''</p>''');
  EXECUTE def;

  -- Correo a quien busca apoyo cuando llega alguien de su tema. De paso, la
  -- flecha del enlace había llegado como «?» al pegar la migración.
  def := pg_get_functiondef('public.avisar_buscadores()'::regprocedure);
  def := replace(def, 'Si estás en una situación de riesgo, llama al 024 ', 'Si estás en una situación de riesgo, llama al 112');
  def := replace(def, '(gratis, 24 horas) o al 112. Puedes desactivar', '. Puedes desactivar');
  def := replace(def, 'Ver quién es ?</a>', 'Ver quién es →</a>');
  EXECUTE def;
END
$$;

-- Las bienvenidas ya enviadas.
UPDATE public.mensajes_equipo
   SET contenido = replace(contenido,
     'Si es urgente, el 024 atiende gratis las 24 horas y, en una emergencia, el 112.',
     'Si es urgente, llama al 112.')
 WHERE contenido LIKE '%el 024 atiende gratis%';
