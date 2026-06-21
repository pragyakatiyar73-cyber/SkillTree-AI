-- Add leetcode_username to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leetcode_username TEXT;

-- Add placement_readiness and internship_readiness to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS placement_readiness INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS internship_readiness INTEGER DEFAULT 0;

-- Add total_learning_hours to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_learning_hours NUMERIC DEFAULT 0;

-- Add skill_hours JSONB to track individual skill hours
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill_hours JSONB DEFAULT '{}';

-- Create feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  best_feature TEXT,
  missing_feature TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create daily analytics summary table
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  active_users INTEGER DEFAULT 0,
  new_signups INTEGER DEFAULT 0,
  roadmaps_generated INTEGER DEFAULT 0,
  projects_created INTEGER DEFAULT 0,
  mock_interviews INTEGER DEFAULT 0,
  resumes_built INTEGER DEFAULT 0,
  mentor_sessions INTEGER DEFAULT 0,
  feedback_submitted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "select_own_feedback" ON feedback FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Analytics policies - users can insert their own events
CREATE POLICY "insert_own_events" ON analytics_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "select_own_events" ON analytics_events FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Analytics daily is read-only for authenticated users
CREATE POLICY "select_analytics_daily" ON analytics_daily FOR SELECT TO authenticated USING (true);

-- Create index for analytics queries
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);
