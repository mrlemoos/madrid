-- Share a note via an unguessable link.
--
-- Access model: the note stays owner-only under RLS. Sharing adds ONE public
-- read path -- a SECURITY DEFINER RPC keyed by an unguessable token. Anon never
-- gets table SELECT on notes, so there is no enumeration surface: the token in
-- the link is the only secret. Live updates ride a public Realtime broadcast
-- topic named after the token (knowing the topic == holding the link), emitted
-- by a trigger. No revoke yet (share_token, once set, is permanent).

-- share_token may already exist in some environments (it was added to the
-- generated types ahead of this migration); keep this idempotent.
ALTER TABLE public.notes
    ADD COLUMN IF NOT EXISTS share_token TEXT;

-- One token -> one note. Partial unique index skips the many NULLs (unshared).
CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_share_token
    ON public.notes (share_token)
    WHERE share_token IS NOT NULL;

-- Public read-model for a shared note. SECURITY DEFINER bypasses RLS but only
-- ever returns the single row whose token matches -- callers cannot list or
-- probe other notes. Returns the derived read-model (content), never the Yjs
-- update log.
CREATE OR REPLACE FUNCTION public.get_shared_note(p_token TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content JSONB,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT n.id, n.title, n.content, n.updated_at
    FROM public.notes n
    WHERE n.share_token = p_token
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_note(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_note(TEXT) TO anon, authenticated;

-- Push live edits to viewers. Fires on any content/title change of a shared
-- note and broadcasts a small ping (viewers refetch via the RPC -- the payload
-- stays tiny and always-correct regardless of note size). Public channel
-- (private => false): the token in the topic name is the access control.
CREATE OR REPLACE FUNCTION public.broadcast_shared_note_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.share_token IS NOT NULL
       AND (NEW.content IS DISTINCT FROM OLD.content
            OR NEW.title IS DISTINCT FROM OLD.title) THEN
        PERFORM realtime.send(
            jsonb_build_object('updated_at', NEW.updated_at),
            'update',
            'share:' || NEW.share_token,
            false
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notes_broadcast_shared_update ON public.notes;
CREATE TRIGGER notes_broadcast_shared_update
    AFTER UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION public.broadcast_shared_note_update();

COMMENT ON FUNCTION public.get_shared_note(TEXT) IS
    'Public read-model for a link-shared note. Token-gated; returns at most one row. No revoke yet.';
