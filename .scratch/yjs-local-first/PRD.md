Status: ready-for-agent

# Yjs local-first note editing (Supabase as transport)

## Problem Statement

Writing in a note feels wrong. Mid-typing, the caret jumps to the bottom of the
document. Users lose their place. We have tried to patch this several times and
it keeps coming back. The root cause: remote sync replaces the whole editor
document (`setContent` on a `contentRevision` change) while the user is typing,
clobbering the live ProseMirror selection. On top of that, writes feel laggy
because the body round-trips through the network as last-write-wins jsonb, and
there is no path to live multi-user collaboration on that model.

## Solution

Stop treating the note body as a replaceable jsonb blob. Model it as a CRDT
(Yjs) that the editor binds to locally, so remote changes _merge_ into the
document instead of replacing it. The caret can never be clobbered because the
editor is never force-reset. Local writes are instant (edit the in-memory Yjs
doc, persist to IndexedDB, sync in the background). The same CRDT machinery is
what live collaboration will later ride on, with no re-architecture.

Supabase stays. Auth (Clerk third-party), RLS, Storage, Billing, and Realtime
are unchanged. Supabase becomes the transport and durability layer for Yjs
updates rather than the store of a single jsonb document.

The only user-visible change in this spec: the caret stops jumping and typing
feels instant. Collaboration is designed-for but deferred (see Out of Scope).

## User Stories

1. As a writer, I want the caret to stay where I put it while I type, so that I never lose my place mid-sentence.
2. As a writer, I want my edits to appear instantly, so that the editor feels as responsive as a native macOS app.
3. As a writer, I want background link-preview promotion and other automatic document changes to not snap my viewport back to the caret, so that scrolling away stays stable.
4. As a writer editing offline, I want my changes saved locally and synced when I reconnect, so that I never lose work.
5. As a writer, I want a note I open on a second device to reflect edits made on the first, so that my vault is consistent.
6. As a writer, I want an existing note (created before this change) to open and edit exactly as before, so that migration is invisible to me.
7. As a writer, I want my note title, folder, and editor settings to keep saving as they do today, so that nothing about metadata regresses.
8. As a writer, I want internal-link graph, plain-text search, and OG scanning to keep working on my notes, so that no feature regresses.
9. As a writer, I want undo/redo to behave correctly, so that CRDT sync does not corrupt my history.
10. As a writer with two tabs open on the same note, I want edits in one to reflect in the other without conflict, so that I can work across windows.
11. As a Nota Pro user, I want cloud sync of the note body to remain gated behind entitlement, so that the paid boundary is unchanged.
12. As a non-entitled user, I want no cloud writes of my body CRDT, so that the free/paid boundary holds.
13. As the product owner, I want the update-log schema to already support multiple concurrent writers, so that live collaboration is a purely additive later change.
14. As the product owner, I want the update log compacted to snapshots, so that late joiners and re-opens do not replay the entire edit history.
15. As a future collaborator (deferred), I want to edit a note shared with me and see others' cursors, so that we can write together live.
16. As a mobile (future Expo) user, I want the CRDT core logic to be portable, so that native can reuse it without pulling in web-only IndexedDB or editor code.

## Implementation Decisions

### Architecture

- **Root cause fix, not symptom.** Replace the `content` + `contentRevision` +
  `setContent` sync path in the TipTap editor with a Yjs binding. The editor is
  never programmatically reset for the same note; remote updates merge.
- **DB vendor unchanged.** Supabase remains for auth/RLS/storage/billing/Realtime.

### Schema

- New append-only update log table `note_yjs_updates(note_id, seq, update bytea, actor, created_at)`.
  RLS owner-only for now, but shaped for N writers (no assumption of a single author).
- Periodic **snapshot compaction**: fold updates into one snapshot row past a
  naive threshold, delete folded rows. Threshold is a tuning knob, not fixed
  cleverness.
- `notes.content` jsonb is **retained as a derived read-model**. On save the
  client serializes the Yjs doc to ProseMirror JSON and dual-writes `content`,
  so every downstream reader (link graph, plain-text, OG, mobile) is untouched.

### Source of truth

- Editing source of truth = the Yjs update log. `notes.content` is the
  denormalized projection.
- **Lazy seeding:** when a note has no `note_yjs_updates` rows, the client builds
  the initial Yjs doc from `content` jsonb and writes the first update. No batch
  migration, no downtime, self-heals per note. Concurrent seeds of the same base
  merge safely.

### Offline

- **Split by data nature.** Yjs (`y-indexeddb`) owns note-body offline
  persistence + update queueing. The existing outbox
  (`@getmadrid/notes-offline-core` / `@getmadrid/notes-offline`) continues to own scalar
  row fields: title, folder, `editor_settings`, create, delete, list merge.
- The two systems do not overlap; body updates never route through the outbox.

### Transport

- Supabase Realtime, two channels:
  - Postgres CDC on `note_yjs_updates` — persisted updates, applied on insert.
  - `broadcast` channel — ephemeral awareness (cursors/presence), never stored.
- A thin custom Yjs provider (subscribe + `applyUpdate`), not a framework. No new
  stateful socket server; stays consistent with static-SPA + stateless
  `nota-server`.
- Ship incremental updates (small payloads); rely on server-side compaction so
  late joiners do not replay the full log.

### CRDT library + editor binding

- Yjs + first-party `@tiptap/extension-collaboration` and
  `@tiptap/extension-collaboration-cursor` (TipTap v2, built on `y-prosemirror`),
  matching current pins.
- **Disable StarterKit `history`** — Yjs owns undo/redo.
- Existing behaviors must still fire on Yjs `docChanged`: typewriter-scroll-guard
  (`nota-typewriter-scroll-guard`) and `convertLinkOnlyParagraphs`
  (link-preview promotion).

### New module

- `@getmadrid/notes-yjs-core` (`platform:shared`, pure, no IndexedDB/Supabase/editor).
  Interface (names indicative):
  - `seedYDocFromContent(content) -> Uint8Array` (initial update from ProseMirror JSON)
  - `foldUpdatesToDoc(updates) -> YDoc` (log rows -> doc)
  - `yDocToContent(doc) -> ProseMirrorJSON` (doc -> derived read-model)
  - `shouldCompact(updateCount | logSize) -> boolean` (naive threshold)
- Editor binding, Supabase provider, and `y-indexeddb` wiring are thin adapters
  over this core.

### Entitlement

- Cloud writes of body updates require Nota Pro entitlement, matching today's
  `NotesDataProvider` gating. Non-entitled path performs no cloud CRDT writes.

## Testing Decisions

- **Test external behavior, not implementation.** The workhorse is a round-trip
  invariant on the pure core: `content -> seedYDocFromContent -> foldUpdatesToDoc
-> yDocToContent` equals the original `content` (structural ProseMirror
  equality, not `JSON.stringify`). Concurrent-update merge determinism is
  golden-tested.
- **Primary seam:** `@getmadrid/notes-yjs-core`. Pure functions, no I/O. Tested with
  Vitest, AAA markers, golden fixtures — mirroring
  `@getmadrid/notes-offline-core` (`merge-note-with-local.spec.ts`,
  `drain-outbox.spec.ts`, `merge-note-lists-golden.spec.ts`).
- **Compaction:** `shouldCompact` and fold-to-snapshot tested purely (threshold
  crossing, snapshot equals full fold).
- **Adapters** (editor binding, Supabase provider, `y-indexeddb`) are kept dumb;
  covered by light integration checks only, since logic lives in the core seam.
- Prior art for structural doc equality already exists in the editor
  (`PMNode.fromJSON` + `doc.eq`); reuse that comparison approach in tests.

## Out of Scope

- **Multi-user ACL / sharing.** No `note_collaborators` table, membership RLS,
  invite flow, roles, or seat/billing question for collaboration. Schema and
  transport are shaped so this is purely additive later.
- Live awareness UI beyond wiring the broadcast channel (cursors rendered only
  once collaboration ships).
- Any change to auth, storage buckets, billing, or the marketing app.
- Mobile/Expo implementation (only the portability constraint on the core is in
  scope).

## Further Notes

- Honest scope: zero user-visible change except the caret stops jumping and
  typing feels instant. All collaboration machinery is latent.
- Watch list: compaction so late joiners do not replay; Realtime payload size;
  StarterKit `history` disabled; typewriter-scroll-guard and
  `convertLinkOnlyParagraphs` still firing on `docChanged`; CSP already allows
  Supabase Realtime WS.
- Phasing (dependency order, not parallel): (1) `@getmadrid/notes-yjs-core` pure
  package + tests; (2) schema migration + RLS for `note_yjs_updates`; (3)
  `y-indexeddb` persistence + Supabase Yjs provider adapter; (4) editor binding
  swap (Collaboration ext, remove `setContent`/`contentRevision` path, disable
  history); (5) derived-`content` dual-write on save; (6) compaction routine.
