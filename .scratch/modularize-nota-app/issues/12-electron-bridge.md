# 12 — Extract `electron-bridge` core + ui

**What to build:** A `electron-bridge-core` (`platform:web`) lib with the menubar payload
and window-chrome logic, plus a `electron-bridge-ui` (`platform:web`) lib with the menubar
bridge, traffic-lights controller, update settings section, window drag band, clipboard-note
glue, menubar events, update status, and release-notes dialog. Desktop menubar, traffic
lights, window drag, and updater behave exactly as before.

**Blocked by:** 02 — `@getmadrid/note-runtime`.

**Status:** done

- [x] Two buildable libs; both `platform:web`
- [x] Characterization tests added for untested menubar-events/clipboard/window-chrome modules before the move; existing electron specs travel with them
- [x] `hiddenInset` padding/safe-area, drag/no-drag regions, sidebar toggle above the drag band, updater IPC unchanged; original app files deleted
- [x] `nx run-many -t build lint test` green

## Comments

- Created `@getmadrid/electron-bridge-core` (`platform:web`, `emitDeclarationOnly`, `exports` → `src`,
  `@getmadrid/source` condition) with subpaths `./menubar-payload`, `./window-chrome`,
  `./menubar-events`, `./update-status`, `./clipboard-plain-text`. Moved
  `electron-menubar-payload.ts`, `electron-window-chrome.ts`, `electron-menubar-events.ts`,
  `nota-update-status.ts`, `clipboard-plain-text-to-tiptap-doc.ts` + specs from `apps/nota/src/lib`.
- Created `@getmadrid/electron-bridge-ui` (`platform:web`) with subpaths `./use-is-electron`,
  `./window-drag-band`, `./traffic-lights-controller`, `./update-settings-section`,
  `./release-notes-dialog`, `./clipboard-note`, `./menubar-bridge`. Moved
  `use-is-electron.ts`, `electron-window-drag-band.tsx`, `electron-traffic-lights-controller.tsx`,
  `electron-update-settings-section.tsx`, `release-notes-dialog.tsx`, `electron-clipboard-note.ts`,
  `electron-menubar-bridge.tsx` + specs. Copied/adapted `nota-electron-globals.d.ts` into the
  package (included via `tsconfig.lib.json`/`tsconfig.spec.json`).
- Added `use-electron-bridge-translator.ts` (local translator hook, matches
  `writing-activity-ui`/`note-folders-ui` pattern) and `vite-env.ts` (typed
  `VITE_NOTA_SERVER_API_URL` reader) inside `electron-bridge-ui`.
- `ReleaseNotesDialog` now calls `fetchReleases` from `@getmadrid/nota-server-client` directly, with
  the Clerk token from `@getmadrid/data-source/clerk-token-ref` (`getClerkAccessToken`) and the base
  URL from the package's own `vite-env.ts` — no more local `nota-server-client` re-wrap, and no
  extra `@clerk/react` dependency needed.
- Collateral moves so the new packages never import from `apps/nota`:
  - `pdf-attachment-client.ts` + spec → `packages/notes-chrome-ui/src/` (export
    `./pdf-attachment-client`; added `@getmadrid/data-source`, `@getmadrid/database-types` deps).
  - `audio-to-note-start.ts` → `packages/note-capture-ui/src/` (export
    `./audio-to-note-start`; added `@getmadrid/app-navigation-core` dep, alongside existing
    `data-source`/`notes-offline`/`note-runtime`/`note-capture-core`/`database-types`).
  - `create-note-client.ts` + spec → `packages/note-folders-ui/src/` (export
    `./create-note-client`; added `@getmadrid/app-navigation-core`, `@getmadrid/writing-activity-ui` deps).
- Fixed `Json`/`Note`/`NoteAttachment` type imports across moved files to `@getmadrid/database-types`
  and `cn` imports to `@getmadrid/web-design/utils`.
- Relative imports inside `electron-bridge-ui` (`nodenext` module resolution) needed explicit
  `.js` extensions (e.g. `./use-is-electron.js`) — without them `tsc` failed with TS2835 and the
  broken resolution cascaded into a wall of `no-unsafe-*` ESLint errors.
- Wired root `tsconfig.json`, `apps/nota/tsconfig.app.json` references, and
  `apps/nota/package.json` workspace deps for both new packages; ran `pnpm install` (had to pin
  `@testing-library/react` to `16.3.0` in `electron-bridge-ui`'s `package.json` — no
  `catalog:` entry exists for it, matching the version pinned in `packages/web-design` and the
  root `package.json`).
- Rewrote all `apps/nota` consumer imports (`app-root.tsx`, `notes-shell.tsx`,
  `notes-shell-parts.tsx`, `notes.settings.tsx`, `note-image-lightbox.tsx`,
  `notes-sidebar-list.tsx`, `auth-screen-shell.tsx`, `note-editor.tsx`, `command-palette.tsx`,
  `audio-to-note-dock.tsx`, `use-audio-note-pending-drain.ts`, `nota-pro-gate.tsx`) plus all
  `vi.mock` paths in their specs, then deleted every original app copy (incl.
  `apps/nota/src/types/nota-electron-globals.d.ts`, unused by any remaining app file).
- `electron-window-chrome.spec.ts` doesn't read `styles.css` from disk, so no path fix was
  needed there (unlike `notes-chrome-core`'s spec).
- Verified: `pnpm exec nx run-many -t build,lint,test -p @getmadrid/electron-bridge-core,
@getmadrid/electron-bridge-ui,@getmadrid/notes-chrome-ui,@getmadrid/note-capture-ui,@getmadrid/note-folders-ui,
@getmadrid/nota --outputStyle=static` — all green (`@getmadrid/nota` alone: 31 test files, 113 tests
  passing; only pre-existing warning is an unrelated `react/jsx-no-useless-fragment` in
  `providers.spec.tsx`).
