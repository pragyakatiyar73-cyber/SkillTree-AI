/*
# Add profiles FK constraint and roadmap index

1. Changes
- Add foreign key constraint on `profiles.id` referencing `auth.users(id)` with ON DELETE CASCADE.
- This ensures data integrity: when an auth user is deleted, their profile is also removed.
- Add index on `roadmaps.user_id` for faster lookups.

2. Security
- No new RLS policies needed; existing policies remain unchanged.

3. Important Notes
- The FK constraint is safe to add because all existing profile IDs already correspond to auth users (they are created via trigger).
- The index improves roadmap query performance when filtering by user_id.
*/

-- Add foreign key constraint on profiles.id
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add index on roadmaps.user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);
