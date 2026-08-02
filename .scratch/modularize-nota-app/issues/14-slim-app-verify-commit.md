# 14 — Slim `apps/nota`, fix context map, verify workspace, land one commit

**What to build:** With every cluster extracted, reduce `apps/nota/src` to composition only
(main, app-root, providers, routes, shared-note-view, top-level screens/one-offs), correct
`CONTEXT-MAP.md`, confirm the whole workspace is green, and land the entire migration as a
**single commit on `main`** (the one-PR/branch rule is waived for this change).

**Blocked by:** 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13.

**Status:** done (commit intentionally excluded — see Comments)

- [x] `apps/nota/src` contains only composition + top-level screens; no leftover feature `lib/`/`components` that belongs in a package
- [x] `CONTEXT-MAP.md` drops the ghost `study-capture-core` / `shared` entries and lists the real new packages; add per-package `CONTEXT.md` lazily
- [x] `@nx/enforce-module-boundaries` passes for the full layering (no upward or cross-layer imports)
- [x] `nx run-many -t build lint test` green across the whole workspace; app runs unchanged (notes, journal, palette, capture, folders, electron)
- [ ] Everything squashed into one Conventional-Commits commit on `main` (e.g. `refactor(nota): modularize SPA into buildable libs`) — **awaiting explicit user request; do not commit**

## Comments

### 1. Slim audit of `apps/nota/src`

By the time this ticket was picked up, tickets 01–13 had already moved almost everything.
`apps/nota/src` now contains only:

- **Composition/bootstrap:** `main.tsx`, `app-root.tsx` (+ spec), `providers.tsx` (+ spec).
- **Routes (top-level screens):** `routes/login.tsx`, `routes/signup.tsx`,
  `routes/notes.graph.tsx`, `routes/notes.journal.tsx`, `routes/notes.settings.tsx`,
  `routes/notes.shortcuts.tsx`, `shared-note-view.tsx`.
- **Auth screens (one-offs, not a package cluster):** `auth-screen-shell.tsx`,
  `auth-screen-hash-link.tsx`, `auth-card-epigraph.tsx`, `clerk-sso-callback-route.tsx`,
  `nota-clerk-auth.tsx` (+ spec).
- **Landing/marketing-adjacent one-offs:** `landing-page.tsx`, `cartoon-landscape.tsx`,
  `nota-logo.tsx`, `not-found-screen.tsx`, `app-error-boundary.tsx`,
  `deferred-posthog-root.tsx`.
- **Settings/theme composition (intentionally not extracted per brief):**
  `theme-menu.tsx`, `nota-pro-settings-section.tsx`, `nota-pro-gate.tsx`.
- **Command palette UI (intentionally not extracted — see ticket 06 Comments; no
  `@nota/note-palette-ui` exists):** `command-palette.tsx` (+ spec),
  `command-palette-semantic-sync.tsx`.
- **Welcome-note seed (one-off, app bootstrap only):** `welcome-note-doc.ts` (+ spec),
  `welcome-note-seed.ts` (+ spec).
- **App-level bindings:** `lib/nota-server-client.ts` (+ binding spec) — wraps
  `@nota/nota-server-client` with the app's Clerk token, deliberately kept out of the
  package per its own header comment; `lib/use-nota-translator.ts` (thin i18n passthrough,
  per PRD's excluded-from-new-tests list); `lib/utils.ts` (+ spec, `cn` re-export);
  `lib/navigator-apple-platform.ts`; `lib/vite-env.ts`; `types/database.types.ts`
  (re-export for `~/types/database.types`).
- **App-level integration specs** (deliberately app-resident, not orphans): both read
  `apps/nota/styles.css` and/or cross-reference multiple package UIs from the app, so they
  test integration, not a single package's public API —
  `lib/nota-interaction.spec.ts`, `lib/nota-save-status.spec.ts`.

No leftover feature `lib/`/`components` was found that "obviously belongs" in an existing
package by the ticket's own bar (orphan import of a deleted path, or a duplicate of package
code). Two borderline files were reviewed and deliberately **left in the app**:

- `lib/og-image-url.spec.ts` and `components/flight-code.spec.ts` test
  `safeOgImageSrcForPreview`/`findFlightCodes` — both live only in `@nota/editor` now, with
  zero app-specific coupling. They _could_ move into `packages/editor`, but `@nota/editor`
  currently has no `vitest`/`test` target at all (build-only lib, confirmed via its
  `package.json` `nx.targets`); moving the specs would mean standing up a new test harness
  for the package, which is an unrelated refactor outside this ticket's brief. Left as-is;
  a future ticket can promote them alongside adding `@nota/editor`'s test target.
- `components/link-preview-scan.spec.ts` similarly tests `@nota/editor`'s
  `convertLinkOnlyParagraphs` with no app coupling — same reasoning, left in place.
- `apps/nota/src/hooks/` was an empty directory (all its files had already moved to
  `@nota/app-navigation-ui`/`@nota/note-capture-ui`/etc. in earlier tickets); removed as
  dead cruft since it's untracked and empty.

Command-palette UI (`command-palette.tsx`, `command-palette-semantic-sync.tsx`) and the
settings/theme/welcome-seed one-offs were **not** force-moved, per this ticket's explicit
brief — see ticket 06 Comments for the palette-specific note.

### 2. `CONTEXT-MAP.md`

- Dropped the two ghost rows: `@nota/shared` and `@nota/study-capture-core` (neither exists
  under `packages/`).
- Added rows for all 23 packages created by the modularization wave that were missing from
  the map: `app-navigation-core`, `app-navigation-ui`, `data-source`, `electron-bridge-core`,
  `electron-bridge-ui`, `nota-motion-core`, `nota-motion-ui`, `note-capture-core`,
  `note-capture-ui`, `note-doc-plain-text`, `note-editor-core`, `note-editor-ui`,
  `note-folders-core`, `note-folders-ui`, `note-journal-core`, `note-journal-ui`,
  `note-palette-core`, `note-runtime`, `notes-chrome-core`, `notes-chrome-ui`,
  `notes-yjs-core`, `writing-activity-core`, `writing-activity-ui`.
- Kept every pre-existing real package row unchanged; table stays alphabetised by package
  name, matching the existing convention.
- Did **not** create any per-package `CONTEXT.md` files — the map lists lazy links only, per
  the ticket's explicit "no per-package `CONTEXT.md`" instruction (same lazy-link pattern the
  map already used before this change).

### 3. Older issue statuses (01–06)

Re-audited against what's actually on disk (packages present + app copies gone):

- **01 (`@nota/data-source`), 02 (`@nota/note-runtime`), 03 (`@nota/note-doc-plain-text`),
  04 (`note-journal`), 05 (`note-capture`):** all fully done — package(s) exist, populated,
  specs travelled, and the corresponding `apps/nota/src` originals are gone. Marked
  `Status: done`, ticked their checklists, and added a short Comments note each pointing at
  the verified evidence.
- **06 (`note-palette`):** only half done — `note-palette-core` exists and is fully
  populated (command catalogue, palette mode, shortcuts catalogue, kbd styles, move-pick
  helpers, all with specs), but no `@nota/note-palette-ui` package was ever created; the
  palette UI still lives in the app. Marked `Status: done (core only)`, left the `ui`
  checklist item unticked, and added a Comments note explaining the split and pointing at
  this ticket's decision to leave it (per the brief's explicit "leave it if no
  `@nota/note-palette-ui`" instruction) rather than force-extracting a UI package as an
  unrelated refactor.
- **07–13** were already accurately marked `done` with their own Comments from prior
  tickets; spot-checked 07 and 13 against disk and left untouched.

### 4. Verify

`pnpm exec nx run-many -t build,lint,test --outputStyle=static` across all 44 projects:
exit code 1, with **exactly** the two known/accepted failures and nothing else:

- `@nota/web-design:lint` — 96 pre-existing `@typescript-eslint/no-floating-promises` /
  `no-misused-promises` / `require-await` errors in `src/icons/*` (itsHover-generated icon
  set). Not touched, per brief.
- `@nota/nota-mobile:build` — `eas: command not found` (missing local `eas-cli`
  global install, not a workspace/code problem). Not touched, per brief.

Everything else (all 42 remaining projects, including `@nota/nota` build/lint/test,
`@nota/data-source`, `@nota/note-runtime`, every `-core`/`-ui` pair, `@nota/editor`,
`@nota/note-graph`, `@nota/notes-offline*`, marketing, server, Electron) is green. Also ran
`pnpm exec nx run @nota/nota:lint` on its own (goal 5) — green, only a pre-existing harmless
`react/jsx-no-useless-fragment` warning in `providers.spec.tsx`; `@nx/enforce-module-boundaries`
reports no violations for the app's full dependency layering.

### 5. Commit

**Not created**, per this task's explicit instruction — the ticket's "single commit on
`main`" checklist item stays unticked; the user will commit separately when ready.
