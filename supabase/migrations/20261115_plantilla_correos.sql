-- Los correos, dentro de un marco común: «metoo.» arriba, el contenido, y un
-- pie con el 112 y el enlace a los ajustes de avisos. Antes eran un par de
-- párrafos sueltos, sin nada que dijera de dónde venían.
--
-- Se aplica en las dos funciones por las que se encola todo lo que sale de la
-- base (mensajes del equipo, avisos de temas, resumen semanal, reportes). Las
-- funciones de Supabase (notify-*) usan la misma plantilla en
-- supabase/functions/_shared/email.ts: si cambias una, cambia la otra. La
-- marca del principio evita envolver dos veces.
--
-- Se puede ejecutar más de una vez sin efecto.

CREATE OR REPLACE FUNCTION public.plantilla_correo(p_html text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_html LIKE '%<!-- metoo-plantilla -->%' THEN p_html
    ELSE '<!-- metoo-plantilla -->'
      || '<div style="background:#faf7f5;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif"><style>a{color:#a85a34}</style><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #efe9e5;border-radius:14px"><tr><td style="padding:28px 28px 8px"><p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0a0a0a">metoo<span style="color:#a85a34">.</span></p><div style="font-size:15px;line-height:1.6;color:#262626">'
      || p_html
      || '</div></td></tr><tr><td style="padding:16px 28px 24px;border-top:1px solid #f3eeea;font-size:12px;line-height:1.5;color:#8a8a8a">Apoyo de quien ya pasó por lo mismo · <a href="https://www.metoonetwork.xyz/dashboard/ajustes" style="color:#8a8a8a">Ajustes de avisos</a><br>En una emergencia, llama al 112.</td></tr></table></div>'
  END
$$;

REVOKE ALL ON FUNCTION public.plantilla_correo(text) FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  def text;
BEGIN
  def := pg_get_functiondef('public.encolar_correo(uuid, text, text, boolean)'::regprocedure);
  def := replace(def, 'VALUES (v_email, p_asunto, p_html)', 'VALUES (v_email, p_asunto, plantilla_correo(p_html))');
  def := replace(def, 'VALUES (v_email, p_asunto, p_html, v_from)', 'VALUES (v_email, p_asunto, plantilla_correo(p_html), v_from)');
  EXECUTE def;

  def := pg_get_functiondef('public.encolar_correo_a(text, text, text)'::regprocedure);
  def := replace(def, 'VALUES (p_email, p_asunto, p_html)', 'VALUES (p_email, p_asunto, plantilla_correo(p_html))');
  def := replace(def, 'VALUES (p_email, p_asunto, p_html, v_from)', 'VALUES (p_email, p_asunto, plantilla_correo(p_html), v_from)');
  EXECUTE def;
END
$$;
