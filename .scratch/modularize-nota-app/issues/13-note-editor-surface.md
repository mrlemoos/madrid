# 13 — Extract `note-editor` core + ui (editor surface)

**What to build:** A `note-editor-core` (`platform:web` — see Comments for why not `shared`)
lib with the one bit of pure glue not already extracted elsewhere, plus a `note-editor-ui`
(`platform:web`) lib with the editor surface components — note editor, detail panel, backlinks
panel, layout menu, image lightbox. The open-note editing experience behaves exactly as before.

**Blocked by:** 02 — `@getmadrid/note-runtime`.

**Status:** done

- [x] Two buildable libs; core `platform:shared` where pure (else `platform:web`), ui `platform:web`
- [x] ui depends on core + `@getmadrid/note-runtime` + `@getmadrid/data-source` + `@getmadrid/editor` + `@getmadrid/web-design/*`
- [x] Characterization tests added for untested pure editor modules (backlink math, draft-context, note-title) before the move; existing editor specs travel with them
- [x] Typewriter scroll guard, sticky doc title, save/merge-after-update, backlinks, layout toggle unchanged; original app files deleted
- [x] `nx run-many -t build lint test` green

## Comments

By the time this ticket was picked up, almost all the "core" math already lived in earlier
extractions (backlink math in `@getmadrid/note-link-graph`, layout/theme in `@getmadrid/note-editor-settings`
/ `@getmadrid/editor`, the typewriter guard in `@getmadrid/nota-motion-core`, save/merge/detail-fetch in
`@getmadrid/data-source`). So `note-editor-core` ended up thin by design — it only holds the one bit of
glue that hadn't been extracted yet: the sidebar/backlinks hash-href builder.

### `@getmadrid/note-editor-core` (`platform:web`)

- `platform:web`, not `platform:shared`, because its only export (`noteHashHref`) wraps
  `hashForScreen` from `@getmadrid/app-navigation-core`, which is itself `platform:web` (module
  boundary rules only allow `platform:web` libs to depend on other `platform:web` libs).
- `./note-hash-href` extracted verbatim from `note-detail-panel.tsx`, with an AAA
  characterisation spec (note id round-trip + empty-id fallback to the notes list hash).

### `@getmadrid/note-editor-ui` (`platform:web`)

Moved wholesale from `apps/nota` (originals deleted after rewiring):

- `note-editor.tsx`, `note-detail-panel.tsx` (+ spec), `note-backlinks-panel.tsx`,
  `note-layout-menu.tsx`, `note-image-lightbox.tsx` (+ spec).
- `note-share-button.tsx` and `og-preview-client.ts` — both were sole-consumed by
  `note-editor.tsx`, so they moved with it rather than being left as app orphans.
- `apps/nota/src/lib/notes-yjs/` moved in full (`note-yjs-doc`, `supabase-yjs-provider`,
  `use-note-yjs-doc`, `yjs-base64` + spec) — it was only ever imported by `note-editor.tsx` and
  its own deps (`@getmadrid/data-source`, `@getmadrid/notes-yjs-core`, `yjs`, `y-indexeddb`,
  `@getmadrid/database-types`) are all portable into the package. Only fix needed was swapping the
  app's `~/types/database.types` re-export for `@getmadrid/database-types` directly.
- `apps/nota/src/lib/note-title.ts` deleted; `note-editor.tsx` now imports `persistedDisplayTitle`
  from `@getmadrid/data-source/note-title` (the characterisation spec already living there per the
  TDD brief was reused as-is, no new tests needed).
- `use-nota-translator.ts` stayed in the app (still used by other app components); the package
  got its own local `use-note-editor-translator.ts` wrapping `@getmadrid/i18n`, matching the
  `use-folder-translator.ts` / writing-activity-ui pattern.
- Local `vite-env.ts` added to the package for `VITE_NOTA_SERVER_API_URL` (same pattern as
  `electron-bridge-ui`) — `og-preview-client.ts` and `note-detail-panel.tsx`'s search-index call
  both need `notaServerBaseUrl()`.
- `note-detail-panel.tsx`'s `postSearchIndexNote` call now hits `@getmadrid/nota-server-client`
  directly (base URL + `getClerkAccessToken` from `@getmadrid/data-source/clerk-token-ref`), same
  shape as `ReleaseNotesDialog` in `electron-bridge-ui`, rather than depending on the app's
  `lib/nota-server-client.ts` wrapper.
- `cn` now comes straight from `@getmadrid/web-design/utils`; `hrefForNote`/`parseNoteLinkPath` from
  `@getmadrid/internal-note-link` directly. This left `apps/nota/src/lib/internal-note-link.ts` (a
  thin re-export) with zero importers, so it was deleted too.
- `Note`/`NoteAttachment`/`Database`/`Json` types now come from `@getmadrid/database-types` instead
  of the app's `~/types/database.types` re-export.
- `note-detail-panel.spec.tsx` has one regression test that reads `apps/nota/styles.css` via
  `node:fs` to check a deprecated keyframes class hasn't crept back in. That's a filesystem read
  for a test guard, not a module import, so it doesn't trip `@nx/enforce-module-boundaries` —
  kept as a relative `../../../apps/nota/styles.css` path rather than duplicating/aliasing the
  stylesheet into the package.
- `note-editor-ui`'s `eslint.config.mjs` now includes `nx.configs['flat/react']` (same as
  `packages/editor`) so the `react-hooks/exhaustive-deps` disable comment on the note-switch
  effect in `note-editor.tsx` resolves against a registered rule instead of erroring as unknown.
- `vitest.setup.ts` gained the same `window.matchMedia` stub apps/nota uses, needed by
  `note-image-lightbox.tsx` → `@getmadrid/nota-motion-ui/use-prefers-reduced-motion`.

### Rewiring

- `notes-shell.tsx` imports `NoteDetailPanel` from `@getmadrid/note-editor-ui/note-detail-panel`.
- `notes-sidebar-list.tsx` imports `noteHashHref` from `@getmadrid/note-editor-core/note-hash-href`.
- `apps/nota/package.json` gained `@getmadrid/note-editor-core` + `@getmadrid/note-editor-ui`;
  `apps/nota/tsconfig.app.json` and root `tsconfig.json` gained matching project references
  (same shape as the `app-navigation-*` / `electron-bridge-*` entries). `pnpm install` re-ran
  clean, no catalog pin needed for `@testing-library/react`.
- Also fixed two unrelated lint failures uncovered while running the verification target: an
  unnecessary `as Json` type assertion in the already-added
  `data-source/note-editor-draft-context.spec.ts` characterisation spec.

### Verification

`pnpm exec nx run-many -t build,lint,test -p @getmadrid/note-editor-core,@getmadrid/note-editor-ui,@getmadrid/data-source,@getmadrid/nota --outputStyle=static`
is green (builds, lints, and all specs pass, including `apps/nota`'s full suite and the Vite
production build of the app itself).

Left alone, per brief: `notes-chrome-ui` shell move (ticket 10) — only the two import sites
above were rewired to the new packages.
