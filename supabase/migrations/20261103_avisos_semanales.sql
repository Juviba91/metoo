-- Dos correos semanales para que las parejas posibles no se queden sin hablar.
--
-- 1. A JUAN, CADA LUNES: qué parejas posibles hay que aún no han hablado.
--    Una pareja posible es alguien que busca apoyo en un tema y alguien que
--    acompaña en ese mismo tema, los dos disponibles, sin conversación entre
--    ellos (en ningún sentido) y sin bloqueo. Solo se envía si hay alguna.
--    Cuentas reales: sin @test.local ni bajas.
--
-- 2. A QUIEN BUSCA APOYO: «hay alguien que quizá te pueda escuchar».
--    Mucha gente se registra y no se atreve a escribir. Si en sus temas hay
--    alguien disponible con quien aún no ha hablado, recibe un correo amable
--    con el tema y cuántas personas hay, sin nombres (se ve en la pantalla de
--    bloqueo). Como mucho uno cada 14 días, y no si en ese tiempo ya pidió
--    hablar con alguien. Respeta «avisos por correo» de Ajustes.
--
-- Los correos van por `email_queue` (la cola que ya se vacía cada 5 minutos).
-- `profiles.ultimo_aviso_buscador_at` es una columna y no una tabla aparte a
-- propósito: así no hay que tocar `eliminar_mi_cuenta`.

-- La utilidad de 20261029, por si esta se aplica antes (es idempotente).
CREATE OR REPLACE FUNCTION public.encolar_correo_a(p_email text, p_asunto text, p_html text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_from text;
BEGIN
  SELECT decrypted_secret INTO v_from FROM vault.decrypted_secrets WHERE name = 'from_email';
  IF v_from IS NULL THEN
    INSERT INTO email_queue (recipient_email, subject, html_body) VALUES (p_email, p_asunto, p_html);
  ELSE
    INSERT INTO email_queue (recipient_email, subject, html_body, from_email)
    VALUES (p_email, p_asunto, p_html, v_from);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.encolar_correo_a(text, text, text) FROM PUBLIC, anon, authenticated;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ultimo_aviso_buscador_at timestamptz;

-- ─── las parejas posibles (lo usan las dos funciones) ─────────────────────

CREATE OR REPLACE FUNCTION public.parejas_posibles()
RETURNS TABLE(hashtag_id uuid, seeker_id uuid, volunteer_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH reales AS (
    SELECT p.id FROM profiles p JOIN auth.users u ON u.id = p.id
     WHERE p.deleted_at IS NULL AND p.is_active AND u.email NOT LIKE '%@test.local'
  ),
  busca AS (
    SELECT ph.profile_id, ph.hashtag_id FROM profile_hashtags ph
      JOIN reales r ON r.id = ph.profile_id WHERE ph.role = 'seeker'
  ),
  acompana AS (
    SELECT ph.profile_id, ph.hashtag_id FROM profile_hashtags ph
      JOIN reales r ON r.id = ph.profile_id WHERE ph.role = 'volunteer'
  )
  SELECT b.hashtag_id, b.profile_id, a.profile_id
    FROM busca b
    JOIN acompana a ON a.hashtag_id = b.hashtag_id AND a.profile_id <> b.profile_id
   WHERE NOT EXISTS (SELECT 1 FROM connections c
                      WHERE (c.seeker_id = b.profile_id AND c.volunteer_id = a.profile_id)
                         OR (c.seeker_id = a.profile_id AND c.volunteer_id = b.profile_id))
     AND NOT EXISTS (SELECT 1 FROM blocks bl
                      WHERE (bl.blocker_id = b.profile_id AND bl.blocked_id = a.profile_id)
                         OR (bl.blocker_id = a.profile_id AND bl.blocked_id = b.profile_id))
$$;

REVOKE ALL ON FUNCTION public.parejas_posibles() FROM PUBLIC, anon, authenticated;

-- ─── 1. informe semanal para Juan ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.informe_semanal_parejas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total integer;
  v_filas text;
  v_destino text;
BEGIN
  SELECT count(*) INTO v_total FROM parejas_posibles();
  IF v_total = 0 THEN
    RETURN 0;
  END IF;

  SELECT string_agg(
           '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee"><strong>#'
             || replace(replace(t.label, '<', '&lt;'), '>', '&gt;') || '</strong></td>'
             || '<td style="padding:6px 10px;border-bottom:1px solid #eee">'
             || replace(replace(t.buscan, '<', '&lt;'), '>', '&gt;') || '</td>'
             || '<td style="padding:6px 10px;border-bottom:1px solid #eee">'
             || replace(replace(t.acompanan, '<', '&lt;'), '>', '&gt;') || '</td>'
             || '<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">'
             || t.parejas || '</td></tr>',
           '' ORDER BY t.parejas DESC, t.label)
    INTO v_filas
    FROM (
      SELECT h.label,
             string_agg(DISTINCT s.alias, ', ') AS buscan,
             string_agg(DISTINCT v.alias, ', ') AS acompanan,
             count(*) AS parejas
        FROM parejas_posibles() pp
        JOIN hashtags h ON h.id = pp.hashtag_id
        JOIN profiles s ON s.id = pp.seeker_id
        JOIN profiles v ON v.id = pp.volunteer_id
       GROUP BY h.label
    ) t;

  SELECT decrypted_secret INTO v_destino FROM vault.decrypted_secrets WHERE name = 'moderacion_email';

  PERFORM encolar_correo_a(
    coalesce(v_destino, 'juan@bay-apps.com'),
    'metoo esta semana: ' || v_total || CASE WHEN v_total = 1 THEN ' pareja posible' ELSE ' parejas posibles' END || ' sin hablar',
    '<p>Hola Juan,</p>'
      || '<p>Estas personas podrían ayudarse y todavía no han hablado (mismo tema, las dos '
      || 'disponibles, sin conversación ni bloqueo):</p>'
      || '<table style="border-collapse:collapse;font-size:14px">'
      || '<tr style="text-align:left;color:#666"><th style="padding:6px 10px">Tema</th>'
      || '<th style="padding:6px 10px">Buscan apoyo</th><th style="padding:6px 10px">Acompañan</th>'
      || '<th style="padding:6px 10px">Parejas</th></tr>'
      || v_filas
      || '</table>'
      || '<p><a href="https://www.metoonetwork.xyz/admin">Abrir el panel →</a></p>'
  );

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.informe_semanal_parejas() FROM PUBLIC, anon, authenticated;

-- ─── 2. «hay alguien que quizá te pueda escuchar» ─────────────────────────

CREATE OR REPLACE FUNCTION public.avisar_buscadores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v record;
  v_enviados integer := 0;
BEGIN
  FOR v IN
    SELECT pp.seeker_id,
           (array_agg(h.label ORDER BY h.label))[1] AS tema,
           (array_agg(h.slug ORDER BY h.label))[1] AS slug,
           count(DISTINCT pp.volunteer_id) AS personas,
           count(DISTINCT pp.hashtag_id) AS temas
      FROM parejas_posibles() pp
      JOIN hashtags h ON h.id = pp.hashtag_id
      JOIN profiles s ON s.id = pp.seeker_id
     WHERE (s.ultimo_aviso_buscador_at IS NULL OR s.ultimo_aviso_buscador_at < now() - interval '14 days')
       -- Si ya pidió hablar con alguien hace poco, no hace falta empujar.
       AND NOT EXISTS (SELECT 1 FROM connections c
                        WHERE c.seeker_id = pp.seeker_id AND c.created_at > now() - interval '14 days')
     GROUP BY pp.seeker_id
  LOOP
    IF encolar_correo(
      v.seeker_id,
      'Hay alguien en metoo que quizá te pueda escuchar',
      '<p>Hola,</p>'
        || '<p>En metoo hay '
        || CASE WHEN v.personas = 1 THEN 'una persona que vivió' ELSE v.personas || ' personas que vivieron' END
        || ' <strong>#' || replace(replace(v.tema, '<', '&lt;'), '>', '&gt;') || '</strong>'
        || CASE WHEN v.temas > 1 THEN ' (y otros de tus temas)' ELSE '' END
        || ' y ' || CASE WHEN v.personas = 1 THEN 'está disponible' ELSE 'están disponibles' END
        || ' para acompañarte. Todavía no habéis hablado.</p>'
        || '<p>No hace falta saber qué decir: con un «hola» basta, y no tienes que contar nada '
        || 'que no quieras.</p>'
        || '<p><a href="https://www.metoonetwork.xyz/dashboard?tema=' || v.slug || '">Ver quién es →</a></p>'
        || '<p style="color:#888;font-size:12px">Si estás en una situación de riesgo, llama al 024 '
        || '(gratis, 24 horas) o al 112. Puedes desactivar estos correos en Ajustes.</p>',
      true
    ) THEN
      UPDATE profiles SET ultimo_aviso_buscador_at = now() WHERE id = v.seeker_id;
      v_enviados := v_enviados + 1;
    END IF;
  END LOOP;

  RETURN v_enviados;
END;
$$;

REVOKE ALL ON FUNCTION public.avisar_buscadores() FROM PUBLIC, anon, authenticated;

-- ─── programación (hora UTC; en España, una o dos más) ────────────────────

SELECT cron.schedule('informe-parejas-semanal', '7 7 * * 1', 'SELECT public.informe_semanal_parejas()');
SELECT cron.schedule('avisar-buscadores', '17 17 * * 3', 'SELECT public.avisar_buscadores()');
