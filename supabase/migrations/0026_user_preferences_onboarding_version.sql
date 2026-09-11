-- A nullable version means this account has not completed the current product
-- orientation. Existing rows intentionally stay NULL so they see version 1.
ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS onboarding_version INTEGER;

COMMENT ON COLUMN public.user_preferences.onboarding_version IS
    'The latest product onboarding version completed or skipped by this user.';
