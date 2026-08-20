-- User blocking table
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Email retry queue for failed notifications
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  subject text NOT NULL,
  html_body text NOT NULL,
  from_email text DEFAULT 'metoo <onboarding@resend.dev>',
  retry_count int DEFAULT 0,
  max_retries int DEFAULT 3,
  next_retry_at timestamp with time zone DEFAULT now(),
  error_message text,
  status text DEFAULT 'pending', -- pending, sent, failed
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Rate limiting table (in-memory would be better but DB allows distributed tracking)
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL, -- connection_request, message, post_create
  count int DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, action, DATE(window_start))
);

-- Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocks
CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- RLS Policies for email_queue (admin only)
CREATE POLICY "Service role can manage email queue"
  ON email_queue FOR ALL
  USING (current_setting('role') = 'service_role' OR current_setting('role') = 'authenticated');

-- RLS Policies for rate_limits (user can see their own)
CREATE POLICY "Users can view their own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked_id ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_next_retry ON email_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action);
