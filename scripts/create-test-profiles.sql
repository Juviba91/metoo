-- Script para crear 10 perfiles falsos españoles con diferentes hashtags
-- Ejecutar en Supabase SQL Editor

-- Primero, obtener los IDs de los hashtags que ya existen
-- SELECT id, slug, label FROM public.hashtags ORDER BY label;

-- Luego insertar los perfiles (ajustar los hashtag_ids según lo que obtengas arriba)
INSERT INTO public.profiles (id, alias, role, city, bio, is_active, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'María', 'seeker', 'Barcelona', 'Buscando apoyo en momentos difíciles. Me interesa hablar sobre ansiedad y bienestar.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'Carlos', 'volunteer', 'Madrid', 'Psicólogo con 10 años de experiencia. Apoyo en temas de salud mental y estrés laboral.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'Lucía', 'seeker', 'Valencia', 'Supero una ruptura. Necesito personas que entiendan lo que es pasar por esto.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'Juan', 'volunteer', 'Sevilla', 'Voluntario en crisis emocionales. Siempre disponible para escuchar sin juzgar.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'Elena', 'seeker', 'Bilbao', 'Madre de dos hijos. Lucho contra la depresión postparto. Busco comunidad.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'David', 'volunteer', 'Málaga', 'Coach de vida. Especializado en resiliencia y transformación personal.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440007'::uuid, 'Sofía', 'seeker', 'Zaragoza', 'Estudiante universitaria. Ansiedad social. Quiero conectar con gente en mi situación.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440008'::uuid, 'Miguel', 'volunteer', 'Alicante', 'Exmiembro de AA. Ahora ayudo a otros en recuperación y cambio de hábitos.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440009'::uuid, 'Ana', 'seeker', 'Murcia', 'Viuda desde hace 2 años. Procesando duelo y buscando propósito de vida.', true, now(), now()),
  ('550e8400-e29b-41d4-a716-446655440010'::uuid, 'Pablo', 'volunteer', 'Córdoba', 'Sociólogo especializado en soledad y aislamiento social. Trabajo comunitario.', true, now(), now());

-- Asociar hashtags a perfiles (ejemplo - ajusta según los hashtags disponibles):
-- INSERT INTO public.profile_hashtags (profile_id, hashtag_id) VALUES
--   ('550e8400-e29b-41d4-a716-446655440001'::uuid, <hashtag_id_ansiedad>),
--   ('550e8400-e29b-41d4-a716-446655440001'::uuid, <hashtag_id_salud_mental>),
--   ...
