# 11 — Extract `app-navigation` core + ui

**What to build:** A `app-navigation-core` (`platform:web`) lib with the hash navigation,
clerk-hash navigation, pathname policy, and navigation-auth logic, plus a
`app-navigation-ui` (`platform:web`) lib with the navigation/screen hooks (app-navigation
screen, settings/history/sidebar/today shortcuts, today's-note open, vault-list sync).
Hash routing, screen resolution, and keyboard shortcuts behave exactly as before.

**Blocked by:** 02 — `@getmadrid/note-runtime`.

**Status:** done

- [x] Two buildable libs; both `platform:web`
- [x] `pushState`/`replaceState` patching + queueMicrotask notify preserved; unknown hash → `#/404`, missing note → notFound preserved
- [x] Characterization tests added for untested nav modules (app-navigation, clerk-hash, pathname-policy, nav-auth) before the move; existing nav specs travel with them
- [x] Mod+[ / Mod+], Mod+D, settings/sidebar shortcuts (skip when palette focused) unchanged; original app files deleted
- [x] `nx run-many -t build lint test` green

## Comments

- Characterization spec added for `app-navigation-auth` before the move.
- `todays-note.localDateKey` re-exports `@getmadrid/note-journal-core/local-date-key`.
- Unblocks `notes-chrome-ui` shell/sidebar move (ticket 10) once electron-bridge + note-editor land.
