/*
# Redesign Resume Tables

## Summary
Replaces the existing resumes table with a richer schema that supports:
- professional_summary (text)
- template (text) — selected template name
- theme (text) — 'light' or 'dark'
- profile_photo_url (text)
- skill_levels (jsonb) — array of {skill, level(1-5)}
- certifications (jsonb) — array of {name, issuer, date}

## Changes
1. Drop old resumes table (data loss acceptable — this is a redesign)
2. Create new resumes table with richer columns
3. Create resume_profiles table for reusable profile data
4. RLS + indexes

## New Tables
### resume_profiles
- id (uuid PK)
- user_id (uuid FK auth.users)
- full_name, email, phone, location, linkedin, github, portfolio, website
- profile_photo_url
- professional_summary
- created_at, updated_at

### resumes
- id (uuid PK)
- user_id (uuid FK auth.users)
- profile_id (uuid FK resume_profiles)
- title (text) — resume name
- template (text) — selected template
- theme (text) — 'light' or 'dark'
- education (jsonb)
- experience (jsonb)
- skills (jsonb) — {skill, level}
- projects (jsonb)
- certifications (jsonb)
- is_default (boolean)
- created_at, updated_at
*/

DROP TABLE IF EXISTS resumes CASCADE;

CREATE TABLE resume_profiles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        text,
  email            text,
  phone            text,
  location         text,
  linkedin         text,
  github           text,
  portfolio        text,
  website          text,
  profile_photo_url text,
  professional_summary text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TABLE resumes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id       uuid REFERENCES resume_profiles(id) ON DELETE SET NULL,
  title            text NOT NULL DEFAULT 'Untitled Resume',
  template         text NOT NULL DEFAULT 'modern',
  theme            text NOT NULL DEFAULT 'light',
  education        jsonb NOT NULL DEFAULT '[]'::jsonb,
  experience       jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills           jsonb NOT NULL DEFAULT '[]'::jsonb,
  projects         jsonb NOT NULL DEFAULT '[]'::jsonb,
  certifications   jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default       boolean NOT NULL DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE resume_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- resume_profiles policies
CREATE POLICY "select_own_resume_profiles" ON resume_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_resume_profiles" ON resume_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_resume_profiles" ON resume_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_resume_profiles" ON resume_profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- resumes policies
CREATE POLICY "select_own_resumes" ON resumes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_resumes" ON resumes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_resumes" ON resumes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_resumes" ON resumes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX resumes_user_id_idx ON resumes(user_id);
CREATE INDEX resume_profiles_user_id_idx ON resume_profiles(user_id);
