/*
# Fix Function Security Issues

## Summary
Addresses four Supabase security advisories:

1. **Mutable search_path on `update_updated_at`** — adds `SET search_path = ''` so
   the function always resolves objects via fully-qualified names, preventing a
   search_path hijack attack.

2. **Mutable search_path on `handle_new_user`** — same fix applied. All table
   references inside the body are already schema-qualified (`public.profiles`),
   so behaviour is unchanged.

3. **`anon` can execute SECURITY DEFINER `handle_new_user`** — revokes EXECUTE
   from `anon` and `authenticated`. This function is only ever called by the
   `auth` trigger (running as the `postgres` superuser role); no direct RPC
   call from a client is needed or safe.

4. **`authenticated` can execute SECURITY DEFINER `handle_new_user`** — same
   revoke covers this.

## Changes
- `update_updated_at`: recreated with `SET search_path = ''`
- `handle_new_user`: recreated with `SET search_path = ''` + EXECUTE revoked
  from `anon` and `authenticated`

## Notes
- Both functions are recreated with `CREATE OR REPLACE` so existing triggers
  continue to point to them without modification.
- The trigger on `auth.users` that calls `handle_new_user` is owned by the
  `postgres` role and is unaffected by the REVOKE.
*/

-- ── 1. Fix update_updated_at (mutable search_path) ───────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 2. Fix handle_new_user (mutable search_path + public EXECUTE) ────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email);
  RETURN NEW;
END;
$$;

-- Revoke direct RPC execution from client-facing roles.
-- The function is invoked only by the auth trigger (postgres role).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
