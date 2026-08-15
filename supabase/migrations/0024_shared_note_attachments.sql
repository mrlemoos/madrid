-- Attachment metadata for a link-shared note.
--
-- Same access model as `get_shared_note` (0021): SECURITY DEFINER, keyed by the
-- unguessable token, returning only rows for that one note. Anon still has no
-- table SELECT on `note_attachments`, so there is no enumeration surface.
--
-- Metadata only -- never bytes. The bucket stays private and no anon storage
-- policy is added; the app serves the file itself through
-- `/s/<token>/attachment/<id>`, which re-checks the token server-side. `user_id`
-- is deliberately omitted: a public viewer has no business learning who owns the
-- note.
CREATE OR REPLACE FUNCTION public.get_shared_note_attachments(p_token TEXT)
RETURNS TABLE (
    id UUID,
    note_id UUID,
    storage_path TEXT,
    filename TEXT,
    content_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT a.id, a.note_id, a.storage_path, a.filename, a.content_type,
           a.size_bytes, a.created_at
    FROM public.note_attachments a
    JOIN public.notes n ON n.id = a.note_id
    WHERE n.share_token = p_token
    ORDER BY a.created_at;
$$;

REVOKE ALL ON FUNCTION public.get_shared_note_attachments(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_note_attachments(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_shared_note_attachments(TEXT) IS
    'Public attachment metadata for a link-shared note. Token-gated; metadata only, never bytes.';
