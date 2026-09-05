# 2. Modularize the `@getmadrid/nota` SPA into buildable libs

Date: 2026-08-01

Status: Accepted

## Context

`apps/nota/src` had grown to a flat `lib/` of ~80 modules (plus specs), a
`components/` of ~50, and app-wide state in `context/` + `stores/`. Clear feature
clusters existed only by filename prefix (`folder-*`, `journal-*`, `audio-*`/`study-*`,
`nota-motion*`, `notes-*chrome*`, `app-navigation*`, `electron-*`, `palette-*`) with no
enforced boundary between them. Two problems followed:

1. **No boundaries.** Any file could import any other; feature coupling was invisible.
2. **No native reuse path.** The Expo prep in `CLAUDE.md` wants pure logic in
   `platform:shared` packages so a future `apps/nota-mobile` can consume it, but that
   logic was trapped inside the web SPA.

The data-access substrate (`supabase/browser` client, `clerk-token-ref`, `models/*`,
`notes-vault-runtime`) was depended on by 13+ files across every cluster. The runtime
spine (`NotesDataProvider` — already sliced into Actions/Vault/Meta — plus the
`nota-preferences`/`notes-sidebar`/`audio-to-note-session` zustand stores) had 17 and 12
consumers respectively. Both had to move for feature extraction to be possible without
upward (app → package) imports.

## Decision

Break the SPA into **Nx buildable libs**, one `@getmadrid/*` package per cluster, layered:

```
existing shared pkgs (database-types, validation, i18n, notes-offline(-core),
                      notes-yjs-core, internal-note-link, note-link-graph,
                      editor, web-design, …)
   ^
@getmadrid/data-source        platform:web
   ^
@getmadrid/note-runtime       platform:web
   ^
feature  -core  (platform:shared where pure, else platform:web)
   ^
feature  -ui    platform:web
   ^
apps/nota                (routes, app-root, providers, main, shell, top-level screens)
```

### Base layer

- **`@getmadrid/data-source`** (`platform:web`) — Supabase browser client + `anon`,
  `clerk-token-ref`, `models/{notes,folders,note-attachments,user-preferences}`,
  `notes-vault-runtime`, `notes-vault-load`, persistence orchestration
  (`save-note-fields`, `note-detail-fetch`, `note-updated-content-merge`,
  `note-patch-result`), offline drain glue (`notes-offline-sync`,
  `sync-server-notes-to-idb`), `nota-pro-entitled-session`, `note-share-client`,
  `browser-connectivity`. Depends on `@getmadrid/notes-offline(-core)`, `@getmadrid/database-types`.
- **`@getmadrid/note-runtime`** (`platform:web`) — app-wide React contexts
  (`notes-data-context`, `session-context`, `clerk-supabase-bridge`,
  `sticky-doc-title`) + zustand stores (`nota-preferences`, `notes-sidebar`,
  `audio-to-note-session`) + their sync hooks (`use-sync-user-preferences`,
  `use-notes-offline-sync`). Depends on `@getmadrid/data-source`.

### Feature packages — uniform `-core` / `-ui` pairs

Each cluster splits into a `-core` (logic) and a `-ui` (React components) package.
The pair is **structurally uniform**; the `-core` **tag** is `platform:shared` only
when the core is genuinely pure and native-portable, otherwise `platform:web`
(because `platform:shared` may depend only on `platform:shared`, so any core touching
`@getmadrid/data-source` or `@getmadrid/note-runtime` must be `platform:web`).

| Cluster               | `-core` tag | shared-portable core?                                                                                                     |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| journal               | shared      | date math, note grouping                                                                                                  |
| capture (audio/study) | shared      | doc transforms, STT format, duration/title format                                                                         |
| palette               | shared      | command catalogue, mode, shortcuts catalogue                                                                              |
| motion                | shared      | spring, rubberband, interaction, scroll-guard math                                                                        |
| folders               | web         | tree/tint/group math is pure but clients touch data-source                                                                |
| chrome                | web         | class-string builders, signed-url cache                                                                                   |
| navigation            | web         | hash-router + clerk-hash + pathname policy                                                                                |
| electron              | web         | desktop-only bridge                                                                                                       |
| writing-activity      | shared      | tracking math                                                                                                             |
| editor-surface        | shared      | backlink/layout math; `-ui` = note-editor, note-detail-panel, note-backlinks-panel, note-layout-menu, note-image-lightbox |

Additionally, **`@getmadrid/note-doc-plain-text`** (`platform:shared`) extracts the existing
`note-doc-plain-text` helper into a real package, consumed by both `apps/nota` and
`apps/nota-marketing` (replacing the current Astro alias).

`-ui` packages are always `platform:web` and depend on their `-core`, `@getmadrid/note-runtime`,
`@getmadrid/web-design/*`, and `@getmadrid/data-source` as needed.

### What stays in `apps/nota`

App composition only: `main.tsx`, `app-root.tsx`, `providers.tsx`, `routes/*`,
`shared-note-view.tsx`, and top-level screens/one-offs not owned by a feature
(`landing-page`, `not-found-screen`, auth screens, `clerk-sso-callback-route`,
`deferred-posthog-root`, `nota-logo`, `theme-menu`,
`nota-pro-gate`, `cartoon-landscape`, `welcome-note-*`). The editor surface itself
(`note-editor`, `note-detail-panel`, `note-backlinks-panel`, …) moves out to
`@getmadrid/note-editor-ui`.

### Packaging conventions

- **Buildable libs**, mirroring `packages/note-link-graph`: `tsconfig.lib.json` +
  `vite.config.mts`, `"build": "tsc -p tsconfig.lib.json"`, `nx.targets.build`.
- **Subpath `exports` entrypoints, no barrels.** Follow the `@getmadrid/web-design` pattern:
  per-module subpath with the `@getmadrid/source` condition → `src` (Vite/dev reads TS
  source), `dist` for built consumers. No app-side re-export barrels.
- Internal deps `workspace:*`; external shared versions via `catalog:`.
- Tags `scope:getmadrid`, `type:util|feature`, `platform:*`; boundaries enforced by
  `@nx/enforce-module-boundaries` in `eslint.config.mjs`.

### Migration

Executed as a **single commit on `main`** (the usual one-PR/branch rule is waived for
this change), big-bang: create all packages, move files, rewrite import sites, delete
the vacated `apps/nota/src` files in the same commit. No transitional barrels.

## Consequences

- **Positive:** enforced feature boundaries; pure logic (journal, capture, palette,
  motion, writing-activity) lands in `platform:shared` libs ready for `apps/nota-mobile`;
  `apps/nota` shrinks to composition; coupling is now visible in the dependency graph.
- **Negative:** ~20 new packages, each with build/tsconfig/eslint/CONTEXT overhead;
  larger `node_modules` graph; one large migration commit that is hard to review and
  all-or-nothing to roll back.
- **Follow-up:** update `CONTEXT-MAP.md` (currently lists ghost packages
  `study-capture-core` and `shared` that were never created); add `CONTEXT.md` per new
  package lazily.
