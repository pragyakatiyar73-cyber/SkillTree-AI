-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Enable RLS on all analytics-relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile, admins can read all
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "admins_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Roadmaps: users own their roadmaps, admins can read all
CREATE POLICY "users_read_own_roadmaps" ON roadmaps FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_roadmaps" ON roadmaps FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "users_insert_own_roadmaps" ON roadmaps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_roadmaps" ON roadmaps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_roadmaps" ON roadmaps FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AI Projects: users own their projects, admins can read all
CREATE POLICY "users_read_own_ai_projects" ON ai_projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_ai_projects" ON ai_projects FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "users_insert_own_ai_projects" ON ai_projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_ai_projects" ON ai_projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_ai_projects" ON ai_projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Mock Interviews: users own their interviews, admins can read all
CREATE POLICY "users_read_own_mock_interviews" ON mock_interviews FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_mock_interviews" ON mock_interviews FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "users_insert_own_mock_interviews" ON mock_interviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_mock_interviews" ON mock_interviews FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_mock_interviews" ON mock_interviews FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Resumes: users own their resumes, admins can read all
CREATE POLICY "users_read_own_resumes" ON resumes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_resumes" ON resumes FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "users_insert_own_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_resumes" ON resumes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_resumes" ON resumes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Mentor Sessions: users own their sessions, admins can read all
CREATE POLICY "users_read_own_mentor_sessions" ON mentor_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_mentor_sessions" ON mentor_sessions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "users_insert_own_mentor_sessions" ON mentor_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_mentor_sessions" ON mentor_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_mentor_sessions" ON mentor_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Feedback: users own their feedback, admins can read all
CREATE POLICY "users_read_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "admins_read_all_feedback" ON feedback FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "users_insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_feedback" ON feedback FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Analytics Events: users can insert their own, admins can read all
CREATE POLICY "users_insert_own_analytics_events" ON analytics_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_read_all_analytics_events" ON analytics_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- Analytics Daily: only admins can read
CREATE POLICY "admins_read_analytics_daily" ON analytics_daily FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
