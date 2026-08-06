# 04 — Extract `note-journal` core + ui

**What to build:** A `note-journal-core` (`platform:shared`) lib with journal date-title
parsing, journal note selection/grouping, and month-grid transition math, plus a
`note-journal-ui` (`platform:web`) lib with the calendar, notes list, and journal screen.
The `#/notes/journal` route consumes the ui package and behaves exactly as before.

**Blocked by:** 02 — `@nota/note-runtime`.

**Status:** done

- [x] Two buildable libs per the house pattern; core `platform:shared`, ui `platform:web`
- [x] core imports no web-only package; ui depends on core + `@nota/note-runtime` + `@nota/web-design/*`
- [x] Characterization tests added for untested pure journal modules before the move; existing journal specs travel with their modules
- [x] Journal route + calendar behave unchanged; original app files deleted (no barrels)
- [x] `nx run-many -t build lint test` green

## Comments

- Verified during ticket 14's audit: `packages/note-journal-core/src` holds the date-title
  parsing, notes grouping, month-grid transition, and local-date-key math (each with a
  spec); `packages/note-journal-ui/src` holds the calendar, notes list, and journal screen.
  `apps/nota/src/routes/notes.journal.tsx` composes `@nota/note-journal-ui`; no journal
  files remain under `apps/nota/src/lib` or `apps/nota/src/components`.
- `nx run-many -t build,lint,test` is green for `@nota/note-journal-core`,
  `@nota/note-journal-ui`, and consumers (see ticket 14 Comments).
