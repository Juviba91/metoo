-- Avisa por correo de lo que escribe la gente desde la app.
--
-- La burbuja de feedback y las sugerencias de hashtag escribían en dos tablas
-- que no se miran desde ninguna pantalla: ni el panel de admin las enseñaba.
-- Alguien se tomaba la molestia de contar que algo no funciona, la app le
-- respondía «lo leeremos con atención», y no lo leía nadie.
--
-- Reutiliza `notificar_por_email()`, de `20260907_webhooks_aviso_email.sql`.
-- Una sola Edge Function para las dos tablas: distingue por `payload.table`.

DROP TRIGGER IF EXISTS avisar_feedback ON public.feedback;
CREATE TRIGGER avisar_feedback
AFTER INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.notificar_por_email('notify-feedback');

DROP TRIGGER IF EXISTS avisar_sugerencia ON public.hashtag_suggestions;
CREATE TRIGGER avisar_sugerencia
AFTER INSERT ON public.hashtag_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.notificar_por_email('notify-feedback');
