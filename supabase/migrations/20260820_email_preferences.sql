-- Add email notification preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true;

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications ON profiles(email_notifications_enabled);
