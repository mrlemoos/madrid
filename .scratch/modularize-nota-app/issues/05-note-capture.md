# 05 — Extract `note-capture` core + ui

**What to build:** A `note-capture-core` (`platform:shared`) lib with the capture
doc-transforms (audio-note-blocks-to-doc, audio-to-note-apply), xAI STT audio format,
recording-duration formatting, and study-note-title, plus a `note-capture-ui`
(`platform:web`) lib with the audio-to-note dock, upload/start clients, pending-drain
IndexedDB glue, and the recording-upload warning banner. Assistive capture behaves exactly
as before.

**Blocked by:** 02 — `@nota/note-runtime`.

**Status:** done

- [x] Two buildable libs; core `platform:shared` (pure transforms/formatters), ui `platform:web`
- [x] ui depends on core + `@nota/note-runtime` + `@nota/data-source` + `@nota/nota-server-client`
- [x] Characterization tests added for untested pure capture modules (blocks-to-doc, stt-format, duration, study-title) before the move; existing capture specs travel with them
- [x] Recording → note flow (online + offline append) unchanged; original app files deleted
- [x] `nx run-many -t build lint test` green

## Comments

- Verified during ticket 14's audit: `packages/note-capture-core/src` holds
  `audio-note-blocks-to-doc`, `format-recording-duration`, `study-note-title`, and
  `daily-note-display-title` (each with a spec bar the last); `packages/note-capture-ui/src`
  holds the dock, upload/start clients, pending-drain IndexedDB glue, STT format, and the
  recording-upload warning banner. No capture/audio-to-note files remain under
  `apps/nota/src`.
- `nx run-many -t build,lint,test` is green for `@nota/note-capture-core`,
  `@nota/note-capture-ui`, and consumers (see ticket 14 Comments).
