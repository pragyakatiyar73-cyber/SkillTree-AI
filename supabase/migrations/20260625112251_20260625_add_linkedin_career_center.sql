/*
# LinkedIn Career Center Schema

## Summary
Adds tables for LinkedIn profile builder, profile analyzer, and networking
task tracking. This enables the LinkedIn Career Center inside the Placement Hub.

## New Tables
1. `linkedin_profiles` - Stores user's LinkedIn profile data and AI-generated content
2. `linkedin_analyses` - Profile analysis results with scores and suggestions
3. `networking_tasks` - Weekly networking tasks with completion tracking

## Modified Tables
- `profiles` - adds `linkedin_url`, `linkedin_score`, `connections_goal` columns

## Security
- All tables have RLS enabled with owner-scoped policies.
*/

-- Add LinkedIn columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS connections_goal INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS current_connections INTEGER DEFAULT 0;

-- LinkedIn Profiles table
CREATE TABLE IF NOT EXISTS linkedin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  headline TEXT,
  about TEXT,
  skills TEXT[] DEFAULT '{}',
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  certifications TEXT[] DEFAULT '{}',
  profile_url TEXT,
  generated_headline TEXT,
  generated_about TEXT,
  generated_skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- LinkedIn Analyses table
CREATE TABLE IF NOT EXISTS linkedin_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  profile_url TEXT,
  overall_score INTEGER DEFAULT 0,
  headline_score INTEGER DEFAULT 0,
  about_score INTEGER DEFAULT 0,
  skills_score INTEGER DEFAULT 0,
  experience_score INTEGER DEFAULT 0,
  suggestions TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

-- Networking Tasks table
CREATE TABLE IF NOT EXISTS networking_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'connection' CHECK (category IN ('connection', 'post', 'engagement', 'profile', 'skill')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  week_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies

ALTER TABLE linkedin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_linkedin" ON linkedin_profiles;
CREATE POLICY "select_own_linkedin" ON linkedin_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_linkedin" ON linkedin_profiles;
CREATE POLICY "insert_own_linkedin" ON linkedin_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_linkedin" ON linkedin_profiles;
CREATE POLICY "update_own_linkedin" ON linkedin_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_linkedin" ON linkedin_profiles;
CREATE POLICY "delete_own_linkedin" ON linkedin_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE linkedin_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_analyses" ON linkedin_analyses;
CREATE POLICY "select_own_analyses" ON linkedin_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_analyses" ON linkedin_analyses;
CREATE POLICY "insert_own_analyses" ON linkedin_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_analyses" ON linkedin_analyses;
CREATE POLICY "update_own_analyses" ON linkedin_analyses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_analyses" ON linkedin_analyses;
CREATE POLICY "delete_own_analyses" ON linkedin_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE networking_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_networking" ON networking_tasks;
CREATE POLICY "select_own_networking" ON networking_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_networking" ON networking_tasks;
CREATE POLICY "insert_own_networking" ON networking_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_networking" ON networking_tasks;
CREATE POLICY "update_own_networking" ON networking_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_networking" ON networking_tasks;
CREATE POLICY "delete_own_networking" ON networking_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_linkedin_profiles_user ON linkedin_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_analyses_user ON linkedin_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_networking_tasks_user ON networking_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_networking_tasks_date ON networking_tasks(user_id, due_date);
