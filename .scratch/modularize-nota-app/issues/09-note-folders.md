# 09 — Extract `note-folders` core + ui

**What to build:** A `note-folders-core` lib with the folder tree building, tint presets,
sidebar note grouping, and move-pick math, plus a `note-folders-ui` (`platform:web`) lib
with the folder CRUD clients (create/rename/delete/move), tint update, empty-folder pruning,
rename-request, the create-folder shortcut, and the folder create/delete dialogs. Folder
selection, tinting, and moves behave exactly as before.

**Blocked by:** 02 — `@nota/note-runtime`.

**Status:** done

- [x] Two buildable libs. Core is tagged `platform:web` (its clients depend on `@nota/data-source`); if a fully-pure subset (tree/tint/group math) is cleanly separable it may be `platform:shared`, otherwise keep core web
- [x] ui depends on core + `@nota/data-source` + `@nota/note-runtime` + `@nota/web-design/*`
- [x] Characterization tests added for untested folder client/pruning modules before the move; existing folder-tree/tint/move-pick specs travel with them
- [x] Folder tint (icon+name only, no row fill), move, rename, delete, prune-empty behaviour unchanged; original app files deleted
- [x] `nx run-many -t build lint test` green

## Comments

- Core tagged `platform:shared` (tree / tint / sidebar groups only). Move-pick math already
  lives in `@nota/note-palette-core` from ticket 06; left there.
- Characterization specs added before the move for `note-sidebar-groups`,
  `folder-rename-request`, and `maybe-prune-empty-folder`.
