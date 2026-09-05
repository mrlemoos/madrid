# Context map

Multi-context layout for the Madrid monorepo. Each context has a `CONTEXT.md` glossary (created lazily by `/grill-with-docs`) and optional `docs/adr/` for scoped decisions.

System-wide ADRs live in [`docs/adr/`](docs/adr/).

## Apps

| Context                     | `CONTEXT.md`                                                       | ADRs                                                             |
| --------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Web SPA (`@getmadrid/nota`) | [`apps/nota/CONTEXT.md`](apps/nota/CONTEXT.md)                     | [`apps/nota/docs/adr/`](apps/nota/docs/adr/)                     |
| Marketing site              | [`apps/nota-marketing/CONTEXT.md`](apps/nota-marketing/CONTEXT.md) | [`apps/nota-marketing/docs/adr/`](apps/nota-marketing/docs/adr/) |
| Electron desktop            | [`apps/nota-electron/CONTEXT.md`](apps/nota-electron/CONTEXT.md)   | [`apps/nota-electron/docs/adr/`](apps/nota-electron/docs/adr/)   |

## Packages

Packages extracted from the `apps/nota` SPA during the modularisation wave (see
[ADR 0002](docs/adr/0002-modularize-nota-app-into-buildable-libs.md)) follow a `-core`
(logic; `platform:shared` where pure, else `platform:web`) + `-ui` (`platform:web`) pair per
feature cluster.

| Context                            | `CONTEXT.md`                                                                             | ADRs                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `@getmadrid/app-navigation-core`   | [`packages/app-navigation-core/CONTEXT.md`](packages/app-navigation-core/CONTEXT.md)     | [`packages/app-navigation-core/docs/adr/`](packages/app-navigation-core/docs/adr/)     |
| `@getmadrid/app-navigation-ui`     | [`packages/app-navigation-ui/CONTEXT.md`](packages/app-navigation-ui/CONTEXT.md)         | [`packages/app-navigation-ui/docs/adr/`](packages/app-navigation-ui/docs/adr/)         |
| `@getmadrid/clerk-oauth-protocol`  | [`packages/clerk-oauth-protocol/CONTEXT.md`](packages/clerk-oauth-protocol/CONTEXT.md)   | [`packages/clerk-oauth-protocol/docs/adr/`](packages/clerk-oauth-protocol/docs/adr/)   |
| `@getmadrid/data-source`           | [`packages/data-source/CONTEXT.md`](packages/data-source/CONTEXT.md)                     | [`packages/data-source/docs/adr/`](packages/data-source/docs/adr/)                     |
| `@getmadrid/database-types`        | [`packages/database-types/CONTEXT.md`](packages/database-types/CONTEXT.md)               | [`packages/database-types/docs/adr/`](packages/database-types/docs/adr/)               |
| `@getmadrid/editor`                | [`packages/editor/CONTEXT.md`](packages/editor/CONTEXT.md)                               | [`packages/editor/docs/adr/`](packages/editor/docs/adr/)                               |
| `@getmadrid/electron-bridge-core`  | [`packages/electron-bridge-core/CONTEXT.md`](packages/electron-bridge-core/CONTEXT.md)   | [`packages/electron-bridge-core/docs/adr/`](packages/electron-bridge-core/docs/adr/)   |
| `@getmadrid/electron-bridge-ui`    | [`packages/electron-bridge-ui/CONTEXT.md`](packages/electron-bridge-ui/CONTEXT.md)       | [`packages/electron-bridge-ui/docs/adr/`](packages/electron-bridge-ui/docs/adr/)       |
| `@getmadrid/error-boundary`        | [`packages/error-boundary/CONTEXT.md`](packages/error-boundary/CONTEXT.md)               | [`packages/error-boundary/docs/adr/`](packages/error-boundary/docs/adr/)               |
| `@getmadrid/helper-hooks`          | [`packages/helper-hooks/CONTEXT.md`](packages/helper-hooks/CONTEXT.md)                   | [`packages/helper-hooks/docs/adr/`](packages/helper-hooks/docs/adr/)                   |
| `@getmadrid/i18n`                  | [`packages/i18n/CONTEXT.md`](packages/i18n/CONTEXT.md)                                   | [`packages/i18n/docs/adr/`](packages/i18n/docs/adr/)                                   |
| `@getmadrid/internal-note-link`    | [`packages/internal-note-link/CONTEXT.md`](packages/internal-note-link/CONTEXT.md)       | [`packages/internal-note-link/docs/adr/`](packages/internal-note-link/docs/adr/)       |
| `@getmadrid/link-platform-preview` | [`packages/link-platform-preview/CONTEXT.md`](packages/link-platform-preview/CONTEXT.md) | [`packages/link-platform-preview/docs/adr/`](packages/link-platform-preview/docs/adr/) |
| `@getmadrid/nota-motion-core`      | [`packages/nota-motion-core/CONTEXT.md`](packages/nota-motion-core/CONTEXT.md)           | [`packages/nota-motion-core/docs/adr/`](packages/nota-motion-core/docs/adr/)           |
| `@getmadrid/nota-motion-ui`        | [`packages/nota-motion-ui/CONTEXT.md`](packages/nota-motion-ui/CONTEXT.md)               | [`packages/nota-motion-ui/docs/adr/`](packages/nota-motion-ui/docs/adr/)               |
| `@getmadrid/note-capture-core`     | [`packages/note-capture-core/CONTEXT.md`](packages/note-capture-core/CONTEXT.md)         | [`packages/note-capture-core/docs/adr/`](packages/note-capture-core/docs/adr/)         |
| `@getmadrid/note-capture-ui`       | [`packages/note-capture-ui/CONTEXT.md`](packages/note-capture-ui/CONTEXT.md)             | [`packages/note-capture-ui/docs/adr/`](packages/note-capture-ui/docs/adr/)             |
| `@getmadrid/note-doc-plain-text`   | [`packages/note-doc-plain-text/CONTEXT.md`](packages/note-doc-plain-text/CONTEXT.md)     | [`packages/note-doc-plain-text/docs/adr/`](packages/note-doc-plain-text/docs/adr/)     |
| `@getmadrid/note-editor-core`      | [`packages/note-editor-core/CONTEXT.md`](packages/note-editor-core/CONTEXT.md)           | [`packages/note-editor-core/docs/adr/`](packages/note-editor-core/docs/adr/)           |
| `@getmadrid/note-editor-settings`  | [`packages/note-editor-settings/CONTEXT.md`](packages/note-editor-settings/CONTEXT.md)   | [`packages/note-editor-settings/docs/adr/`](packages/note-editor-settings/docs/adr/)   |
| `@getmadrid/note-editor-ui`        | [`packages/note-editor-ui/CONTEXT.md`](packages/note-editor-ui/CONTEXT.md)               | [`packages/note-editor-ui/docs/adr/`](packages/note-editor-ui/docs/adr/)               |
| `@getmadrid/note-folders-core`     | [`packages/note-folders-core/CONTEXT.md`](packages/note-folders-core/CONTEXT.md)         | [`packages/note-folders-core/docs/adr/`](packages/note-folders-core/docs/adr/)         |
| `@getmadrid/note-folders-ui`       | [`packages/note-folders-ui/CONTEXT.md`](packages/note-folders-ui/CONTEXT.md)             | [`packages/note-folders-ui/docs/adr/`](packages/note-folders-ui/docs/adr/)             |
| `@getmadrid/note-graph`            | [`packages/note-graph/CONTEXT.md`](packages/note-graph/CONTEXT.md)                       | [`packages/note-graph/docs/adr/`](packages/note-graph/docs/adr/)                       |
| `@getmadrid/note-journal-core`     | [`packages/note-journal-core/CONTEXT.md`](packages/note-journal-core/CONTEXT.md)         | [`packages/note-journal-core/docs/adr/`](packages/note-journal-core/docs/adr/)         |
| `@getmadrid/note-journal-ui`       | [`packages/note-journal-ui/CONTEXT.md`](packages/note-journal-ui/CONTEXT.md)             | [`packages/note-journal-ui/docs/adr/`](packages/note-journal-ui/docs/adr/)             |
| `@getmadrid/note-link-graph`       | [`packages/note-link-graph/CONTEXT.md`](packages/note-link-graph/CONTEXT.md)             | [`packages/note-link-graph/docs/adr/`](packages/note-link-graph/docs/adr/)             |
| `@getmadrid/note-palette-core`     | [`packages/note-palette-core/CONTEXT.md`](packages/note-palette-core/CONTEXT.md)         | [`packages/note-palette-core/docs/adr/`](packages/note-palette-core/docs/adr/)         |
| `@getmadrid/note-runtime`          | [`packages/note-runtime/CONTEXT.md`](packages/note-runtime/CONTEXT.md)                   | [`packages/note-runtime/docs/adr/`](packages/note-runtime/docs/adr/)                   |
| `@getmadrid/notes-chrome-core`     | [`packages/notes-chrome-core/CONTEXT.md`](packages/notes-chrome-core/CONTEXT.md)         | [`packages/notes-chrome-core/docs/adr/`](packages/notes-chrome-core/docs/adr/)         |
| `@getmadrid/notes-chrome-ui`       | [`packages/notes-chrome-ui/CONTEXT.md`](packages/notes-chrome-ui/CONTEXT.md)             | [`packages/notes-chrome-ui/docs/adr/`](packages/notes-chrome-ui/docs/adr/)             |
| `@getmadrid/notes-offline`         | [`packages/notes-offline/CONTEXT.md`](packages/notes-offline/CONTEXT.md)                 | [`packages/notes-offline/docs/adr/`](packages/notes-offline/docs/adr/)                 |
| `@getmadrid/notes-offline-core`    | [`packages/notes-offline-core/CONTEXT.md`](packages/notes-offline-core/CONTEXT.md)       | [`packages/notes-offline-core/docs/adr/`](packages/notes-offline-core/docs/adr/)       |
| `@getmadrid/notes-yjs-core`        | [`packages/notes-yjs-core/CONTEXT.md`](packages/notes-yjs-core/CONTEXT.md)               | [`packages/notes-yjs-core/docs/adr/`](packages/notes-yjs-core/docs/adr/)               |
| `@getmadrid/validation`            | [`packages/validation/CONTEXT.md`](packages/validation/CONTEXT.md)                       | [`packages/validation/docs/adr/`](packages/validation/docs/adr/)                       |
| `@getmadrid/design`                | [`packages/design/CONTEXT.md`](packages/design/CONTEXT.md)                               | [`packages/design/docs/adr/`](packages/design/docs/adr/)                               |
| `@getmadrid/writing-activity-core` | [`packages/writing-activity-core/CONTEXT.md`](packages/writing-activity-core/CONTEXT.md) | [`packages/writing-activity-core/docs/adr/`](packages/writing-activity-core/docs/adr/) |
| `@getmadrid/writing-activity-ui`   | [`packages/writing-activity-ui/CONTEXT.md`](packages/writing-activity-ui/CONTEXT.md)     | [`packages/writing-activity-ui/docs/adr/`](packages/writing-activity-ui/docs/adr/)     |
