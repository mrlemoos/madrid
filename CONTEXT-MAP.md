# Context map

Multi-context layout for the Nota monorepo. Each context has a `CONTEXT.md` glossary (created lazily by `/grill-with-docs`) and optional `docs/adr/` for scoped decisions.

System-wide ADRs live in [`docs/adr/`](docs/adr/).

## Apps

| Context                          | `CONTEXT.md`                                                       | ADRs                                                             |
| -------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Web SPA (`@nota/nota`)           | [`apps/nota/CONTEXT.md`](apps/nota/CONTEXT.md)                     | [`apps/nota/docs/adr/`](apps/nota/docs/adr/)                     |
| API server (`@nota/nota-server`) | [`apps/nota-server/CONTEXT.md`](apps/nota-server/CONTEXT.md)       | [`apps/nota-server/docs/adr/`](apps/nota-server/docs/adr/)       |
| Marketing site                   | [`apps/nota-marketing/CONTEXT.md`](apps/nota-marketing/CONTEXT.md) | [`apps/nota-marketing/docs/adr/`](apps/nota-marketing/docs/adr/) |
| Electron desktop                 | [`apps/nota-electron/CONTEXT.md`](apps/nota-electron/CONTEXT.md)   | [`apps/nota-electron/docs/adr/`](apps/nota-electron/docs/adr/)   |
| Mobile (Expo)                    | [`apps/nota-mobile/CONTEXT.md`](apps/nota-mobile/CONTEXT.md)       | [`apps/nota-mobile/docs/adr/`](apps/nota-mobile/docs/adr/)       |

## Packages

| Context                       | `CONTEXT.md`                                                                             | ADRs                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `@nota/clerk-oauth-protocol`  | [`packages/clerk-oauth-protocol/CONTEXT.md`](packages/clerk-oauth-protocol/CONTEXT.md)   | [`packages/clerk-oauth-protocol/docs/adr/`](packages/clerk-oauth-protocol/docs/adr/)   |
| `@nota/database-types`        | [`packages/database-types/CONTEXT.md`](packages/database-types/CONTEXT.md)               | [`packages/database-types/docs/adr/`](packages/database-types/docs/adr/)               |
| `@nota/editor`                | [`packages/editor/CONTEXT.md`](packages/editor/CONTEXT.md)                               | [`packages/editor/docs/adr/`](packages/editor/docs/adr/)                               |
| `@nota/helper-hooks`          | [`packages/helper-hooks/CONTEXT.md`](packages/helper-hooks/CONTEXT.md)                   | [`packages/helper-hooks/docs/adr/`](packages/helper-hooks/docs/adr/)                   |
| `@nota/i18n`                  | [`packages/i18n/CONTEXT.md`](packages/i18n/CONTEXT.md)                                   | [`packages/i18n/docs/adr/`](packages/i18n/docs/adr/)                                   |
| `@nota/internal-note-link`    | [`packages/internal-note-link/CONTEXT.md`](packages/internal-note-link/CONTEXT.md)       | [`packages/internal-note-link/docs/adr/`](packages/internal-note-link/docs/adr/)       |
| `@nota/link-platform-preview` | [`packages/link-platform-preview/CONTEXT.md`](packages/link-platform-preview/CONTEXT.md) | [`packages/link-platform-preview/docs/adr/`](packages/link-platform-preview/docs/adr/) |
| `@nota/mobile-editor`         | [`packages/mobile-editor/CONTEXT.md`](packages/mobile-editor/CONTEXT.md)                 | [`packages/mobile-editor/docs/adr/`](packages/mobile-editor/docs/adr/)                 |
| `@nota/nota-server-client`    | [`packages/nota-server-client/CONTEXT.md`](packages/nota-server-client/CONTEXT.md)       | [`packages/nota-server-client/docs/adr/`](packages/nota-server-client/docs/adr/)       |
| `@nota/note-editor-settings`  | [`packages/note-editor-settings/CONTEXT.md`](packages/note-editor-settings/CONTEXT.md)   | [`packages/note-editor-settings/docs/adr/`](packages/note-editor-settings/docs/adr/)   |
| `@nota/note-graph`            | [`packages/note-graph/CONTEXT.md`](packages/note-graph/CONTEXT.md)                       | [`packages/note-graph/docs/adr/`](packages/note-graph/docs/adr/)                       |
| `@nota/note-link-graph`       | [`packages/note-link-graph/CONTEXT.md`](packages/note-link-graph/CONTEXT.md)             | [`packages/note-link-graph/docs/adr/`](packages/note-link-graph/docs/adr/)             |
| `@nota/notes-offline`         | [`packages/notes-offline/CONTEXT.md`](packages/notes-offline/CONTEXT.md)                 | [`packages/notes-offline/docs/adr/`](packages/notes-offline/docs/adr/)                 |
| `@nota/notes-offline-core`    | [`packages/notes-offline-core/CONTEXT.md`](packages/notes-offline-core/CONTEXT.md)       | [`packages/notes-offline-core/docs/adr/`](packages/notes-offline-core/docs/adr/)       |
| `@nota/shared`                | [`packages/shared/CONTEXT.md`](packages/shared/CONTEXT.md)                               | [`packages/shared/docs/adr/`](packages/shared/docs/adr/)                               |
| `@nota/study-capture-core`    | [`packages/study-capture-core/CONTEXT.md`](packages/study-capture-core/CONTEXT.md)       | [`packages/study-capture-core/docs/adr/`](packages/study-capture-core/docs/adr/)       |
| `@nota/validation`            | [`packages/validation/CONTEXT.md`](packages/validation/CONTEXT.md)                       | [`packages/validation/docs/adr/`](packages/validation/docs/adr/)                       |
| `@nota/web-design`            | [`packages/web-design/CONTEXT.md`](packages/web-design/CONTEXT.md)                       | [`packages/web-design/docs/adr/`](packages/web-design/docs/adr/)                       |
