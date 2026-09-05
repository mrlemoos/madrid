# Modularize the `@getmadrid/nota` SPA into buildable libs

Status: ready-for-agent

Related ADR: [`docs/adr/0002-modularize-nota-app-into-buildable-libs.md`](../../docs/adr/0002-modularize-nota-app-into-buildable-libs.md)

## Problem Statement

`apps/nota/src` has grown a flat `lib/` of ~80 modules, a `components/` of ~50, and
app-wide state scattered across `context/` and `stores/`. Feature clusters exist only by
filename prefix, with no enforced boundary between them: any file can import any other, so
coupling is invisible and unchecked. Separately, the Expo prep in `CLAUDE.md` wants pure
logic living in `platform:shared` packages so a future `apps/nota-mobile` can reuse it, but
today that logic is trapped inside the web SPA. The team wants the app broken into
modules — with the guarantee that behaviour is preserved through the move.

## Solution

Break the SPA into Nx **buildable libs**, one `@getmadrid/*` package per feature cluster, in a
strict dependency layering (see ADR 0002):

```
existing shared pkgs
   ^
@getmadrid/data-source        (web)  — supabase client, models, vault-runtime, persistence, offline drain
   ^
@getmadrid/note-runtime       (web)  — app-wide contexts + zustand stores
   ^
feature -core  (shared where pure, else web)  →  feature -ui (web)
   ^
apps/nota                — composition only (main, app-root, providers, routes, screens)
```

Each feature cluster becomes a uniform `-core` (logic) + `-ui` (React) pair. Packages
expose subpath `exports` entrypoints (the `@getmadrid/web-design` / `note-link-graph` pattern,
`@getmadrid/source` condition → `src`), with **no re-export barrels** in the app. Nx module
boundaries (`@nx/enforce-module-boundaries`) enforce the layering by `platform:*` tag. The
whole change lands as a **single commit on `main`** (the usual one-PR rule is waived).

Behaviour is preserved by testing at each package's public entrypoint: existing specs move
with their modules and lock behaviour, and untested pure-logic modules gain
characterization tests _before_ they move.

## User Stories

1. As a Nota engineer, I want each feature cluster in its own `@getmadrid/*` buildable lib, so
   that feature boundaries are explicit rather than implied by filename prefix.
2. As a Nota engineer, I want `@getmadrid/data-source` to own the Supabase browser client,
   `clerk-token-ref`, `models/*`, and `notes-vault-runtime`, so that every feature depends
   on one clear data-access base instead of reaching into app internals.
3. As a Nota engineer, I want persistence orchestration (`save-note-fields`,
   `note-detail-fetch`, `note-updated-content-merge`, `note-patch-result`) inside
   `@getmadrid/data-source`, so that the read/write path lives with the data layer it drives.
4. As a Nota engineer, I want the offline drain glue (`notes-offline-sync`,
   `sync-server-notes-to-idb`) folded into `@getmadrid/data-source`, so that the Supabase drain
   sits beside the vault mutator it uses.
5. As a Nota engineer, I want `@getmadrid/note-runtime` to own the app-wide contexts
   (notes-data Actions/Vault/Meta, session, clerk-supabase-bridge, sticky-doc-title) and
   the zustand stores (preferences, sidebar, audio-session), so that the runtime spine is a
   single dependency for every feature UI.
6. As a Nota engineer, I want `useNotesData*`, `useNotaPreferences`, and the other runtime
   hooks importable from `@getmadrid/note-runtime`, so that feature UIs consume shared state
   without an upward import into the app.
7. As a Nota engineer, I want a `note-journal` core/ui pair, so that journal date math and
   calendar UI are isolated and the core is native-portable (`platform:shared`).
8. As a Nota engineer, I want a `note-capture` core/ui pair (audio + study capture), so
   that doc-transforms and STT formatting live in a `platform:shared` core reusable on
   mobile, with the upload clients and dock UI in the web layer.
9. As a Nota engineer, I want a `note-palette` core/ui pair, so that the command catalogue,
   palette mode, and shortcuts catalogue are pure/shared and the palette UI is web.
10. As a Nota engineer, I want a `nota-motion` core/ui pair, so that spring/rubberband/
    interaction/scroll-guard math is shared and the GSAP/DOM bindings are web.
11. As a Nota engineer, I want a `writing-activity` core/ui pair, so that tracking math is
    shared and the settings section UI is web.
12. As a Nota engineer, I want a `note-folders` core/ui pair, so that tree/tint/group math
    plus the Supabase-touching folder clients and dialogs are grouped (core tagged
    `platform:web` because the clients depend on `@getmadrid/data-source`).
13. As a Nota engineer, I want a `notes-chrome` core/ui pair, so that shell/sidebar class
    builders, banner chrome, and the signed-url cache are grouped with the shell UI.
14. As a Nota engineer, I want an `app-navigation` core/ui pair, so that hash-router glue,
    clerk-hash navigation, and pathname policy are grouped (web).
15. As a Nota engineer, I want an `electron-bridge` core/ui pair, so that desktop-only
    menubar/window/clipboard glue is isolated from the shared feature set.
16. As a Nota engineer, I want a `note-editor` core/ui pair for the editor surface
    (note-editor, note-detail-panel, note-backlinks-panel, note-layout-menu,
    note-image-lightbox), so that the heaviest screen has its own home and backlink/layout
    math is shared.
17. As a Nota engineer, I want `@getmadrid/note-doc-plain-text` as a standalone `platform:shared`
    package, so that both `apps/nota` and `apps/nota-marketing` consume it directly and the
    current Astro alias hack is removed.
18. As a Nota engineer, I want `apps/nota` reduced to composition (main, app-root,
    providers, routes, top-level screens/one-offs), so that the app is a thin shell over
    the feature packages.
19. As a Nota engineer, I want every new lib to be an Nx buildable lib mirroring
    `packages/note-link-graph`, so that build/tsconfig/test tooling is consistent.
20. As a Nota engineer, I want every new lib tagged with the correct `platform:*` tag, so
    that `@nx/enforce-module-boundaries` fails any illegal cross-layer import at lint time.
21. As a Nota engineer, I want packages exposed via subpath `exports` with the
    `@getmadrid/source` condition and no app-side barrels, so that Vite reads TS source in dev
    and built consumers read `dist`.
22. As a Nota engineer, I want the whole migration in one commit on `main`, so that the tree
    is never left half-migrated.
23. As a Nota engineer, I want the app to build, lint, and pass the full test suite after
    the migration, so that I know behaviour is preserved.
24. As a Nota engineer, I want every existing spec to keep asserting the same behaviour
    after its module moves, so that the move itself is verified.
25. As a Nota engineer, I want characterization tests added for currently-untested
    pure-logic modules before they move, so that a green baseline guards the migration.
26. As a future Nota mobile engineer, I want the shared cores (journal, capture, palette,
    motion, writing-activity, note-editor, note-doc-plain-text) tagged `platform:shared`,
    so that `apps/nota-mobile` can depend on them without pulling in web-only code.
27. As a Nota maintainer, I want `CONTEXT-MAP.md` corrected to drop the ghost packages
    (`study-capture-core`, `shared`) that were never created and list the real new
    packages, so that the context map reflects reality.

## Implementation Decisions

- **Package set (~24 libs):** base `@getmadrid/data-source` (web) and `@getmadrid/note-runtime`
  (web); feature `-core`/`-ui` pairs for journal, capture, palette, motion,
  writing-activity, note-folders, notes-chrome, app-navigation, electron-bridge,
  note-editor; and standalone `@getmadrid/note-doc-plain-text` (shared). Exact package names may
  be refined at implementation but must keep the `@getmadrid/note-*` / `@getmadrid/nota-*` house style.
- **Dependency direction:** `apps/nota` → feature `-ui` → (`-core` + `@getmadrid/note-runtime`) →
  `@getmadrid/data-source` → existing shared/offline packages. No upward imports.
- **Tagging:** a `-core` is `platform:shared` only when it imports no web-only package;
  any core touching `@getmadrid/data-source` or `@getmadrid/note-runtime` is `platform:web`. All
  `-ui` packages are `platform:web`. Boundaries enforced by the existing
  `@nx/enforce-module-boundaries` rule set in `eslint.config.mjs`.
- **Packaging pattern:** buildable libs mirroring `packages/note-link-graph`
  (`tsconfig.lib.json`, `vite.config.mts`, `"build": "tsc -p tsconfig.lib.json"`,
  `nx.targets.build`); subpath `exports` with the `@getmadrid/source` condition; internal deps
  `workspace:*`, external via `catalog:`.
- **No barrels:** the app imports the new `@getmadrid/*` subpaths directly; the vacated
  `apps/nota/src` files are deleted in the same commit, not left as re-exports.
- **Runtime spine:** `NotesDataProvider` keeps its Actions/Vault/Meta context slices; the
  provider (which calls `@getmadrid/data-source`) and its stores move wholesale into
  `@getmadrid/note-runtime`; `apps/nota` composes the providers at the root.
- **Marketing:** `apps/nota-marketing` switches its `note-doc-plain-text` alias to the new
  `@getmadrid/note-doc-plain-text` package.
- **Delivery:** one commit on `main`; the one-PR/branch convention is explicitly waived for
  this change.

## Testing Decisions

- **Seam:** test each package at its public `exports` entrypoint — black-box behaviour, not
  file internals. This is the single, uniform, highest seam; it survives file moves because
  tests target the exported API, so only import specifiers change.
- **Good test = external behaviour.** Assert the observable contract of an exported function
  (inputs → outputs, side effects on injected collaborators), never private helpers or
  internal call order.
- **Behaviour preservation:** the ~60 existing colocated specs move with their modules and
  keep their assertions; they are the primary guarantee that the move changed nothing.
- **New coverage:** add characterization tests for currently-untested **pure-logic**
  modules _before_ moving them, capturing present behaviour so drift fails. Examples of the
  gap: `folder-tree`, `note-sidebar-groups`, `palette-commands`, `nota-shortcuts-catalogue`,
  `nota-kbd-styles`, motion math (`nota-*` without specs), `note-patch-result`,
  `note-title`. Non-pure clients that hit Supabase/network are tested by injecting a fake
  client where the module already allows it, matching existing prior art.
- **Excluded from new tests:** re-export barrels (`notes-offline.ts`,
  `internal-note-link.ts`), env decls (`vite-env.ts`), thin passthrough hooks
  (`use-is-electron`, `use-nota-translator`), and React components (their behaviour is
  covered by the logic core plus existing app-level specs).
- **Prior art:** Vitest AAA specs colocated as `*.spec.ts(x)` under each package's `src`,
  per `.cursor/rules/aaa-testing-pattern.mdc` and existing specs like
  `note-updated-content-merge.spec.ts`, `folder-tree.spec.ts`, `palette-commands.spec.ts`.
- **Done =** `nx run-many -t build`, `-t lint` (boundaries green), and `-t test` all pass
  across the workspace after the migration.

## Out of Scope

- Any behavioural change to features — this is a pure structural move.
- Creating `apps/nota-mobile` or wiring any package into a mobile app (the shared tags
  merely make it possible later).
- Splitting `-ui` packages further into sub-features, or extracting TipTap internals
  already living in `@getmadrid/editor`.
- Writing tests for React components or trivial passthrough modules.
- Performance work, dependency upgrades, or new features of any kind.

## Further Notes

- `CONTEXT-MAP.md` currently lists `@getmadrid/study-capture-core` and `@getmadrid/shared` which do
  not exist on disk; the capture core supersedes the study-capture role. Correct the map as
  part of this change and add per-package `CONTEXT.md` lazily.
- `note-editor-settings` is already an extracted `platform:shared` package; the stale
  `CLAUDE.md` reference to an in-app copy can be ignored.
- The migration commit is large and all-or-nothing to roll back; that trade-off was
  accepted deliberately (see ADR 0002 Consequences).
