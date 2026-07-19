CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reported_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  connection_id uuid REFERENCES connections(id) ON DELETE SET NULL,
  reason text NOT NULL CHECK (char_length(reason) > 0 AND char_length(reason) <= 100),
  description text CHECK (description IS NULL OR char_length(description) <= 500),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
