-- Enable RLS on core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own connections" ON connections;
DROP POLICY IF EXISTS "Seekers can create connections" ON connections;
DROP POLICY IF EXISTS "Volunteer can accept/reject" ON connections;
DROP POLICY IF EXISTS "Users can read messages from own connections" ON messages;
DROP POLICY IF EXISTS "Users can send messages to own connections" ON messages;
DROP POLICY IF EXISTS "Users can manage own profile_hashtags" ON profile_hashtags;
DROP POLICY IF EXISTS "Users can manage own profile_categories" ON profile_categories;

-- Profiles: Public read (active only), users can update their own
CREATE POLICY "Public read profiles"
  ON profiles FOR SELECT
  USING (is_active = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Connections: Users can only see their own
CREATE POLICY "Users can read own connections"
  ON connections FOR SELECT
  USING (auth.uid() = seeker_id OR auth.uid() = volunteer_id);

CREATE POLICY "Seekers can create connections"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = seeker_id);

CREATE POLICY "Volunteer can accept/reject"
  ON connections FOR UPDATE
  USING (auth.uid() = volunteer_id)
  WITH CHECK (auth.uid() = volunteer_id);

-- Messages: Users can only see/send in their own connections
CREATE POLICY "Users can read messages from own connections"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = messages.connection_id
      AND (c.seeker_id = auth.uid() OR c.volunteer_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to own connections"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM connections c
      WHERE c.id = connection_id
      AND (c.seeker_id = auth.uid() OR c.volunteer_id = auth.uid())
    )
  );

-- Profile hashtags: Users can only manage their own
CREATE POLICY "Users can manage own profile_hashtags"
  ON profile_hashtags FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Profile categories: Users can only manage their own
CREATE POLICY "Users can manage own profile_categories"
  ON profile_categories FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);
