-- Author Display Name snapshot for Share Cards (ADR 0003 §5).
--
-- Shared notes render as `{author} shared {title}` in Open Graph unfurls. The
-- crawler path uses the anon `get_shared_note` RPC only -- never a Clerk Backend
-- call -- so the author's name must be a snapshot on the row. Store it on
-- user_preferences (one row per user, already RLS-owned) and join it into the
-- public read-model. Synced from Clerk on the signed-in client.

ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Adding an OUT column changes the return type, which CREATE OR REPLACE forbids;
-- drop first. Safe: recreated below in the same transaction.
DROP FUNCTION IF EXISTS public.get_shared_note(TEXT);

CREATE FUNCTION public.get_shared_note(p_token TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content JSONB,
    editor_settings JSONB,
    author_display_name TEXT,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT n.id, n.title, n.content, n.editor_settings,
           up.display_name AS author_display_name,
           n.updated_at
    FROM public.notes n
    LEFT JOIN public.user_preferences up ON up.user_id = n.user_id
    WHERE n.share_token = p_token
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_note(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_note(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_shared_note(TEXT) IS
    'Public read-model for a link-shared note. Token-gated; returns at most one row. Includes editor_settings (author theme) and author_display_name (Share Card). No revoke yet.';
