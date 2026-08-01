-- Shared notes must render in the author's chosen theme (font + measure), not
-- the default London look. The public read-model dropped `editor_settings`, so
-- the standalone shared page had no theme to apply. Add it to the RPC output.

-- Adding an OUT column changes the return type, which CREATE OR REPLACE forbids;
-- drop first. Safe: the function is recreated below in the same transaction.
DROP FUNCTION IF EXISTS public.get_shared_note(TEXT);

CREATE FUNCTION public.get_shared_note(p_token TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content JSONB,
    editor_settings JSONB,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT n.id, n.title, n.content, n.editor_settings, n.updated_at
    FROM public.notes n
    WHERE n.share_token = p_token
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_note(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_note(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_shared_note(TEXT) IS
    'Public read-model for a link-shared note. Token-gated; returns at most one row. Includes editor_settings so the shared page renders the author theme. No revoke yet.';
