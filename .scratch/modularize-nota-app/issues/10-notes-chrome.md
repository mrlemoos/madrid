# 10 — Extract `notes-chrome` core + ui

**What to build:** A `notes-chrome-core` (`platform:web`) lib with the shell/sidebar class
builders, chrome-type helpers, banner chrome, sidebar width, and the attachment signed-url
cache, plus a `notes-chrome-ui` (`platform:web`) lib with the notes shell, shell parts,
sidebar list, and resize handle. The glass chrome, banner behaviour, and sidebar rendering
are unchanged.

**Blocked by:** 02 — `@nota/note-runtime`.

**Status:** done

- [x] Two buildable libs; both `platform:web`
- [x] ui depends on core + `@nota/note-runtime` + `nota-motion` + `@nota/web-design/*`
- [x] Characterization tests added for untested pure chrome builders (shell-chrome, tree-styles, banner-chrome, signed-url-cache) before the move; existing chrome specs travel with them
- [x] Sidebar-as-darker-rail glass, banner no-reflash on revisit, reduced-transparency fallbacks unchanged; original app files deleted
- [x] `nx run-many -t build lint test` green (core + ui + collateral packages)

## Comments

- **Core done:** `notes-shell-chrome`, `notes-chrome-type`, `note-banner-chrome`,
  `notes-sidebar-tree-styles`, `note-attachment-signed-url-cache`, plus
  `ATTACHMENT_SIGNED_URL_TTL_SEC` hoist (breaks cycle with `pdf-attachment-client`).
  Specs already existed and travelled with the modules.
- **UI move (final):** `notes-shell`, `notes-shell-parts`, `notes-sidebar-list` (+ specs)
  moved from `apps/nota/src/components` into `@nota/notes-chrome-ui`, exported as
  `./notes-shell`, `./notes-shell-parts`, `./notes-sidebar-list`. Deleted the `./deferred`
  marker export and `src/deferred.ts`. `NotesShell` now takes `routes` (lazily-loaded
  `NotesGraphRoute` / `NotesJournalRoute` / `NotesSettingsRoute` / `NotesShortcutsRoute`)
  and an optional `prefetchRoutes` callback as props, since a package cannot import
  app-local route files; `apps/nota/src/app-root.tsx` builds these with `lazy()` and wires
  a `prefetchNotesShellRoutes` helper (guarded off in Vitest to avoid teardown races).
- **Attachment cycle break:** `pdf-attachment-client`, `note-attachment-signed-url-cache`,
  and `ATTACHMENT_SIGNED_URL_TTL_SEC` moved a layer down again, from `notes-chrome-ui` /
  `notes-chrome-core` into `@nota/data-source` (`./pdf-attachment-client`,
  `./attachment-signed-url-cache`, `./attachment-signed-url-ttl`), since `notes-chrome-ui`
  now also depends on `note-editor-ui` and `electron-bridge-ui`, both of which consumed
  those modules — keeping them in `notes-chrome-*` would have created a cycle. All
  consumers (`note-editor-ui`, `electron-bridge-ui`, `app-root.tsx`) rewired.
- **Collateral moves out of `apps/nota`:** `clientDeleteNoteById` (+ spec) →
  `@nota/note-folders-ui/delete-note-client` (next to `create-note-client`); `AudioToNoteDock`
  and `useAudioNotePendingDrain` (+ specs) → `@nota/note-capture-ui` (`./audio-to-note-dock`,
  `./use-audio-note-pending-drain`). `cn` and `~/types/database.types` app-local imports
  replaced with `@nota/web-design/utils` and `@nota/database-types`. Added a package-local
  `use-notes-chrome-translator.ts` in `notes-chrome-ui`, mirroring the
  `note-folders-ui` / `note-editor-ui` / `electron-bridge-ui` pattern, so the shell doesn't
  reach into the app's `useNotaTranslator`.
- **Tooling gaps found during the move:** `@nota/web-design`'s Vite lib build was missing a
  `context-menu` entry in `libEntries` (only `.d.ts` existed, no `dist/context-menu.js`),
  which only surfaced once a package (not the app, which resolves via the `@nota/source`
  Vite condition) imported `@nota/web-design/context-menu` under the default test resolution
  — fixed by adding the entry and rebuilding. Added `vitest.setup.ts` to `notes-chrome-ui`
  stubbing `localStorage` (Zustand `persist` for the sidebar store) and `window.matchMedia`
  (reduced-motion checks in `nota-motion-ui`), and `nx.configs['flat/react']` to its eslint
  config, mirroring `note-editor-ui`.
- Sidebar width already in `@nota/nota-motion-core` (ticket 07).
- Verified green: `pnpm exec nx run-many -t build,lint,test -p @nota/notes-chrome-ui,@nota/notes-chrome-core,@nota/note-folders-ui,@nota/note-capture-ui,@nota/nota` and a full `pnpm exec nx run-many -t build,lint,test` sweep, aside from two pre-existing, unrelated failures out of scope: `@nota/web-design:lint` (long-standing promise-handling lint errors in `src/icons/*`, untouched by this ticket) and `@nota/nota-mobile:build` (missing local `eas` CLI).
