-- The admin panel reads and writes reports.resolved, but the column was never
-- created (see 20260719_reports.sql). Without it the admin reports query fails
-- and moderation reports never show up.
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS resolved boolean NOT NULL DEFAULT false;

-- Pending reports are the ones the admin panel lists.
CREATE INDEX IF NOT EXISTS reports_unresolved_idx
  ON reports (created_at DESC)
  WHERE NOT resolved;
