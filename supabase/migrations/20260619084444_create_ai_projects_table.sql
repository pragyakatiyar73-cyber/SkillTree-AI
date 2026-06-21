/*
# Create AI Projects Table

## Summary
Adds a table to store AI-generated project blueprints for each user.

## New Tables
1. `ai_projects`
   - `id` (uuid, PK) — unique project identifier
   - `user_id` (uuid, FK auth.users) — owner, defaults to auth.uid()
   - `idea` (text) — the user's original project idea prompt
   - `title` (text) — generated project title
   - `overview` (text) — project overview / description
   - `features` (jsonb) — array of feature objects {name, description}
   - `tech_stack` (jsonb) — object mapping layer -> array of technologies
   - `folder_structure` (text) — generated folder tree as a string
   - `database_schema` (text) — generated DB schema as markdown/text
   - `roadmap` (jsonb) — array of phase objects {phase, tasks, duration}
   - `created_at` / `updated_at` — timestamps

## Security
- RLS enabled on `ai_projects`
- 4 owner-scoped policies (select/insert/update/delete)
- `DEFAULT auth.uid()` on `user_id` so client inserts omit it safely

## Indexes
- `ai_projects_user_id_idx` for fast per-user lookups
*/

CREATE TABLE IF NOT EXISTS ai_projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  idea             text NOT NULL,
  title            text NOT NULL,
  overview         text NOT NULL,
  features         jsonb NOT NULL DEFAULT '[]'::jsonb,
  tech_stack       jsonb NOT NULL DEFAULT '{}'::jsonb,
  folder_structure text NOT NULL DEFAULT '',
  database_schema  text NOT NULL DEFAULT '',
  roadmap          jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE ai_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ai_projects" ON ai_projects;
CREATE POLICY "select_own_ai_projects" ON ai_projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ai_projects" ON ai_projects;
CREATE POLICY "insert_own_ai_projects" ON ai_projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ai_projects" ON ai_projects;
CREATE POLICY "update_own_ai_projects" ON ai_projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ai_projects" ON ai_projects;
CREATE POLICY "delete_own_ai_projects" ON ai_projects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS ai_projects_user_id_idx ON ai_projects(user_id);
