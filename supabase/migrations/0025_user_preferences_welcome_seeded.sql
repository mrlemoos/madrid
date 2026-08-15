-- user_preferences.welcome_seeded: one-shot flag marking that a user's empty
-- vault has already been seeded with the welcome note. Owner-only data on an
-- existing RLS-owned table (one row per Clerk user id), so no policy changes
-- are needed here: the user_preferences policies already cover the column.
--
-- WHY THIS EXISTS EVEN THOUGH 0008 DECLARES THE SAME COLUMN
-- 0008_clerk_third_party_auth.sql contains an identical ADD COLUMN IF NOT
-- EXISTS, but that line was added to the file *after* 0008 had already been
-- recorded as applied on existing projects. Migrations run once, so the edit
-- never reached them: the production database (and any project provisioned
-- before the edit) has user_preferences without welcome_seeded, while a fresh
-- `supabase db reset` gets it from 0008 and looks fine. The drift surfaced as
-- PostgREST 42703 "column user_preferences.welcome_seeded does not exist" on
-- any request naming the column -- e.g. the welcome-note seed writing
-- welcome_seeded = true through upsertUserPreferences.
--
-- Do not "fix" this by editing 0008 again; only a new migration reaches
-- already-migrated projects. IF NOT EXISTS keeps this a no-op where 0008 (or a
-- reset) already created the column.
--
-- Backfill note: existing rows get false. That is correct -- the seed only runs
-- for a vault with zero notes, so users who already have notes are untouched.

ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS welcome_seeded BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_preferences.welcome_seeded IS
    'True once the welcome note has been seeded for this user; keeps seeding idempotent.';
