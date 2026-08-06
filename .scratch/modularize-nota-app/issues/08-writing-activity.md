# 08 — Extract `writing-activity` core + ui

**What to build:** A `writing-activity-core` (`platform:shared`) lib with the writing-activity
tracking math, plus a `writing-activity-ui` (`platform:web`) lib with the writing-activity
settings section. The activity display behaves exactly as before.

**Blocked by:** 02 — `@nota/note-runtime`.

**Status:** done

- [x] Two buildable libs; core `platform:shared`, ui `platform:web`
- [x] ui depends on core + `@nota/note-runtime`
- [x] Existing writing-activity specs travel with their modules and pass at the package entrypoint (add char tests only if a pure gap remains)
- [x] Activity section renders/behaves unchanged; original app files deleted
- [x] `nx run-many -t build lint test` green

## Comments

- Core: pure grid/streak math (`writing-activity.ts`); date keys via `@nota/note-journal-core/local-date-key`.
- UI: preference store tracking + settings section; section uses Base UI `render` prop (not `asChild`).
