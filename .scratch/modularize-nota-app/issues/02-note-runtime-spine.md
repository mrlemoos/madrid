# 02 — Extract `@nota/note-runtime` spine package

**What to build:** A buildable lib `@nota/note-runtime` holding the app-wide runtime spine:
the notes-data contexts (Actions/Vault/Meta slices of `NotesDataProvider`), session
context, clerk-supabase bridge, sticky-doc-title context, and the zustand stores
(preferences, sidebar, audio-session) plus their sync hooks. The provider consumes
`@nota/data-source`. After this ticket every consumer imports `useNotesData*`,
`useNotaPreferences`, and the other runtime hooks from `@nota/note-runtime`, the app root
composes the providers, and the workspace builds green.

**Blocked by:** 01 — `@nota/data-source`.

**Status:** done

- [x] Buildable lib per the house pattern; tagged `scope:nota`, `type:feature`, `platform:web`
- [x] Depends on `@nota/data-source`; boundaries lint passes
- [x] Contexts keep their Actions/Vault/Meta slicing; stores and sync hooks moved in
- [x] Original `apps/nota/src/context` + `stores` files deleted (no barrels); app root composes providers from the package
- [x] All 17 notes-data consumers and 12 preferences consumers rewritten to the package
- [x] `nx run-many -t build lint test` green

## Comments

- Verified during ticket 14's audit: `packages/note-runtime/src` holds `context/`
  (notes-data, clerk-supabase bridge, session, sticky-doc-title), `stores/` (preferences,
  sidebar, audio-session, each with specs), and `lib/` sync hooks. `apps/nota/src/context`
  and `apps/nota/src/stores` no longer exist.
- `nx run-many -t build,lint,test` is green for `@nota/note-runtime` and its consumers (see
  ticket 14 Comments for the full workspace verify run).
