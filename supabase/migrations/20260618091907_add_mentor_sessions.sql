/*
# Add AI Mentor Sessions Support

## Summary
Adds proper session management for the AI Mentor chat feature.

## Changes

### New Tables
1. `mentor_sessions`
   - `id` (uuid, PK) — unique session identifier
   - `user_id` (uuid, FK auth.users) — owner of the session, defaults to auth.uid()
   - `title` (text) — session title derived from first user message
   - `created_at` / `updated_at` — timestamps

### Modified Tables
1. `chat_messages` — adds `session_id` column (nullable uuid FK to mentor_sessions)

### Security
- RLS enabled on `mentor_sessions`
- 4 separate policies (select/insert/update/delete) scoped to `auth.uid() = user_id`
- `chat_messages` already has RLS; existing policies kept intact

### Notes
- `session_id` is nullable for backward compatibility with existing messages
- `DEFAULT auth.uid()` on `mentor_sessions.user_id` so inserts without user_id work
- Index on `mentor_sessions.user_id` and `chat_messages.session_id` for query performance
*/

-- Mentor sessions table
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mentor_sessions" ON mentor_sessions;
CREATE POLICY "select_own_mentor_sessions" ON mentor_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mentor_sessions" ON mentor_sessions;
CREATE POLICY "insert_own_mentor_sessions" ON mentor_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mentor_sessions" ON mentor_sessions;
CREATE POLICY "update_own_mentor_sessions" ON mentor_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mentor_sessions" ON mentor_sessions;
CREATE POLICY "delete_own_mentor_sessions" ON mentor_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS mentor_sessions_user_id_idx ON mentor_sessions(user_id);

-- Add session_id to chat_messages (nullable for backward compat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE chat_messages
      ADD COLUMN session_id uuid REFERENCES mentor_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS chat_messages_session_id_idx ON chat_messages(session_id);
