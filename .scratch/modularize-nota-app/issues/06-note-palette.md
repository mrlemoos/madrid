# 06 — Extract `note-palette` core + ui

**What to build:** A `note-palette-core` (`platform:shared`) lib with the command catalogue,
palette mode, shortcuts catalogue, kbd styles, and the move-pick helpers, plus a
`note-palette-ui` (`platform:web`) lib with the command palette and its semantic-sync
component. Cmd/Ctrl+K and the move-note picker behave exactly as before.

**Blocked by:** 02 — `@getmadrid/note-runtime`.

**Status:** done (core only — see Comments)

- [x] `note-palette-core` buildable lib; `platform:shared`
- [ ] `note-palette-ui` buildable lib; `platform:web` — **not extracted, deliberately deferred (see Comments)**
- [x] Characterization tests added for untested pure palette modules (command catalogue, shortcuts catalogue, kbd styles) before the move; existing palette/move-pick specs travel with them
- [x] Palette open/close, command dispatch, move-picker Enter behaviour unchanged; the core's original app files deleted
- [x] `nx run-many -t build lint test` green

## Comments

- Verified during ticket 14's audit: `packages/note-palette-core/src` holds
  `move-pick-enter`, `move-pick-helpers`, `nota-kbd-styles`, `nota-shortcuts-catalogue`,
  `palette-commands`, and `palette-mode`, each with its spec. The corresponding
  `apps/nota/src/lib/*` originals are gone — the core half of this ticket is complete.
- No `@getmadrid/note-palette-ui` package exists. `apps/nota/src/components/command-palette.tsx`
  and `command-palette-semantic-sync.tsx` (the palette UI) still live in the app, importing
  `@getmadrid/note-palette-core` directly. Ticket 14's brief explicitly says not to force-move the
  palette UI while no `note-palette-ui` package exists, so this is being left as intentional
  app-level composition rather than force-extracted. Re-open a follow-up ticket if the UI
  extraction is wanted later; until then `command-palette.tsx` is accepted as an app
  leftover (documented in ticket 14 Comments).
