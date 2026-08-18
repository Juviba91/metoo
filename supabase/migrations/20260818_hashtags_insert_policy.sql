-- Allow authenticated users to insert new hashtags (free creation from picker and posts)
CREATE POLICY "Authenticated users can insert hashtags"
  ON hashtags FOR INSERT TO authenticated
  WITH CHECK (true);
