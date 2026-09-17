# 01 — Extract `@getmadrid/data-source` base package

**What to build:** A buildable lib `@getmadrid/data-source` that owns the app's data-access
substrate — the Supabase browser client (+ anon), the Clerk access-token reference, the
typed `models` (notes, folders, note-attachments, user-preferences), the vault runtime
(vault mutator + outbox drain), the persistence orchestration (save-note-fields,
note-detail-fetch, note-updated-content-merge, note-patch-result), the offline drain glue
(notes-offline-sync, sync-server-notes-to-idb), plus nota-pro entitlement and connectivity
helpers. After this ticket the SPA imports every one of these from `@getmadrid/data-source`
subpaths, the old `apps/nota/src` copies are gone, and the workspace builds green.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] New buildable lib mirrors `packages/note-link-graph` (tsconfig.lib, vite config, `build` target, subpath `exports` with the `@getmadrid/source` condition)
- [x] Tagged `scope:getmadrid`, `type:util`, `platform:web`; boundaries lint passes
- [x] All listed modules moved in; original `apps/nota/src` files deleted (no barrels)
- [x] Characterization tests added for untested pure modules in this package (e.g. `note-patch-result`, `note-updated-content-merge` if gaps remain) before/with the move
- [x] Existing specs for moved modules travel with them and pass at the package entrypoint
- [x] Every consumer import rewritten to `@getmadrid/data-source`; `nx run-many -t build lint test` green

## Comments

- Verified during ticket 14's audit: `packages/data-source/src` holds `lib/` (Supabase
  client, `clerk-token-ref`, connectivity, vault runtime, persistence orchestration, offline
  drain glue, entitlement) and `models/` (folders, note-attachments, notes,
  user-preferences), each with its spec travelling alongside it. `apps/nota/src/lib` and
  `apps/nota/src/models` no longer contain any of these files.
- `nx run-many -t build,lint,test` is green for `@getmadrid/data-source` and its consumers (see
  ticket 14 Comments for the full workspace verify run).
