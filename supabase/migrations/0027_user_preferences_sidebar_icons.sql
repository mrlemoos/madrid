-- Sidebar icon appearance: two independent toggles, both owner-only columns on
-- the existing RLS-owned user_preferences table (one row per Clerk user id), so
-- the current policies already cover them.
--
-- show_sidebar_note_icons defaults to true: note rows have always drawn the
-- file icon, so existing vaults keep the look they know.
--
-- show_sidebar_folder_icons defaults to false: folder rows currently draw the
-- tint dot that opens the tint menu, and flipping every existing sidebar to
-- folder glyphs on deploy is not ours to decide. New users choose during
-- onboarding.

ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS show_sidebar_note_icons BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS show_sidebar_folder_icons BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_preferences.show_sidebar_note_icons IS
    'True when sidebar note rows draw a file icon beside the title.';

COMMENT ON COLUMN public.user_preferences.show_sidebar_folder_icons IS
    'True when sidebar folder rows draw a folder icon in the folder tint instead of the tint dot.';
