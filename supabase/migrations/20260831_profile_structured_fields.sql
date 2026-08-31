-- Dos campos estructurados en el perfil, de opción cerrada.
--
-- Motivo: los 23 perfiles tienen bio, pero de ~98 caracteres de media sobre
-- los 300 disponibles. La gente quiere contar y escribe poco — pedir más texto
-- libre a quien está en mitad de un diagnóstico o un duelo no funciona. Estas
-- dos preguntas se responden a toques.
--
-- Ambas nullable y sin defecto obligatorio: los perfiles que ya existen siguen
-- siendo válidos y la app los pinta sin el dato hasta que lo rellenen.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stage         text,
  ADD COLUMN IF NOT EXISTS support_modes text[] NOT NULL DEFAULT '{}';

-- El vocabulario de `stage` depende del rol: el voluntario dice cuánto hace
-- que lo vivió, quien busca apoyo en qué punto está. La restricción admite
-- ambos conjuntos (y NULL, para quien aún no lo haya rellenado).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_stage_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_stage_check CHECK (
    stage IS NULL OR stage IN (
      'hace_menos_1', 'hace_1_3', 'hace_mas_3',
      'diagnostico', 'tratamiento', 'despues', 'duelo'
    )
  );

-- `support_modes` comparte valores entre roles a propósito, para poder cruzar
-- "lo que ofrezco" con "lo que busco".
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_support_modes_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_support_modes_check CHECK (
    support_modes <@ ARRAY['escuchar', 'experiencia', 'practico', 'presencial']::text[]
  );
