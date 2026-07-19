-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert feedback"
  ON feedback FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Hashtag suggestions table
CREATE TABLE IF NOT EXISTS hashtag_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  suggestion text NOT NULL CHECK (char_length(suggestion) > 0 AND char_length(suggestion) <= 100),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hashtag_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert suggestions"
  ON hashtag_suggestions FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- Replace hashtag list with curated selection
TRUNCATE hashtags CASCADE;
INSERT INTO hashtags (slug, label) VALUES
  ('uci-neonatal',        'UCI Neonatal'),
  ('uci-pediatrica',      'UCI Pediátrica'),
  ('cirugia-mayor',       'Cirugía mayor'),
  ('cancer',              'Cáncer'),
  ('quimioterapia',       'Quimioterapia'),
  ('trasplante',          'Trasplante'),
  ('ictus',               'Ictus'),
  ('infarto',             'Infarto'),
  ('enfermedad-rara',     'Enfermedad rara'),
  ('diagnostico-reciente','Diagnóstico reciente'),
  ('embarazo-riesgo',     'Embarazo de riesgo'),
  ('parto-dificil',       'Parto difícil'),
  ('perdida-embarazo',    'Pérdida de embarazo'),
  ('muerte-neonatal',     'Muerte neonatal'),
  ('duelo-hijo',          'Duelo por un hijo'),
  ('alzheimer-familiar',  'Alzheimer en familia'),
  ('hijo-enfermo',        'Hijo enfermo'),
  ('bullying',            'Bullying'),
  ('acoso-laboral',       'Acoso laboral'),
  ('adopcion',            'Adopción');
