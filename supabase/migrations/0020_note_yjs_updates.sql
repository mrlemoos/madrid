-- Yjs local-first note body: append-only CRDT update log.
--
-- Source of truth for editing moves here; notes.content stays as a derived
-- read-model (dual-written by the client). Each row is one binary Yjs update
-- (an edit) or a folded snapshot written during compaction.
--
-- Shaped for N concurrent writers so live collaboration is purely additive
-- later: RLS today gates on note *ownership*, but nothing here assumes a single
-- author. When collaboration ships, only the membership check changes (e.g. a
-- note_collaborators lookup replaces the notes.user_id equality) -- the table,
-- the identity seq, and the client all stay as-is.

CREATE TABLE IF NOT EXISTS public.note_yjs_updates (
    -- Global monotonic insertion order. Server-assigned so concurrent writers
    -- never race on a per-note counter; clients replay in seq order. CRDT merge
    -- is commutative, so seq is for determinism/compaction cutoff, not
    -- correctness.
    seq BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    -- One Yjs update (or a folded snapshot when is_snapshot is true), base64.
    -- Stored as TEXT rather than BYTEA so it rides supabase-js/PostgREST JSON
    -- and Realtime CDC payloads without bytea hex-encoding friction. Updates are
    -- small and compacted, so the ~33% base64 overhead is negligible.
    update TEXT NOT NULL,
    is_snapshot BOOLEAN NOT NULL DEFAULT false,
    -- Clerk sub of the writer (audit / future awareness). Not a trust boundary.
    actor TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ordered replay per note (seq is already indexed as PK, but reads always
-- filter by note_id first).
CREATE INDEX IF NOT EXISTS idx_note_yjs_updates_note_seq
    ON public.note_yjs_updates (note_id, seq);

ALTER TABLE public.note_yjs_updates ENABLE ROW LEVEL SECURITY;

-- Ownership check, isolated so a future ACL model swaps only this predicate.
CREATE POLICY "Read updates for accessible notes"
    ON public.note_yjs_updates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_yjs_updates.note_id
            AND notes.user_id = (SELECT auth.jwt()->>'sub')
        )
    );

CREATE POLICY "Append updates to accessible notes"
    ON public.note_yjs_updates FOR INSERT
    TO authenticated
    WITH CHECK (
        actor = (SELECT auth.jwt()->>'sub')
        AND EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_yjs_updates.note_id
            AND notes.user_id = (SELECT auth.jwt()->>'sub')
        )
    );

-- Compaction deletes rows it has folded into a snapshot. Owner-only; no UPDATE
-- policy -- the log is append-only, snapshots are new rows.
CREATE POLICY "Delete folded updates for accessible notes"
    ON public.note_yjs_updates FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.notes
            WHERE notes.id = note_yjs_updates.note_id
            AND notes.user_id = (SELECT auth.jwt()->>'sub')
        )
    );

-- Realtime CDC: clients subscribe to inserts to receive remote updates live.
-- FULL replica identity so the payload carries note_id on insert.
ALTER TABLE public.note_yjs_updates REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.note_yjs_updates;

COMMENT ON TABLE public.note_yjs_updates IS
    'Append-only Yjs CRDT update log for note bodies. Source of truth for editing; notes.content is a derived read-model. Collab-ready: RLS gates on note ownership today, additive ACL later.';
