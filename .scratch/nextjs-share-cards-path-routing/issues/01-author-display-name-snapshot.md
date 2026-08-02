# Author Display Name snapshot + Clerk sync

Status: in-review

## Comments

- Implemented: migration `0023_user_preferences_display_name.sql` (column + `get_shared_note` LEFT JOIN → `author_display_name`); both DB type defs; `getUserPreferences`/`upsertUserPreferences` + vault-load default; `fetchSharedNote`/`SharedNote.authorDisplayName`; `resolveClerkDisplayName` + `useSyncClerkDisplayName` wired in `notes-shell`. Unit test on name precedence passes; `@nota/notes-chrome-ui` build green. Migration applied to remote prod (`kvnrhcsfkahfpjyfqjee`) via `supabase db push --linked`; verified against live schema with `gen types` (matched hand-edited defs; added `get_shared_note` Function type). Build green.

## Parent

ADR 0003 — [`docs/adr/0003-nextjs-share-cards-and-path-routing.md`](../../../docs/adr/0003-nextjs-share-cards-and-path-routing.md) §5

## What to build

Persist an author display name so Share Cards can render `{author} shared {title}` without a Clerk Backend call on the crawler path. This slice is independent of the Next cutover and may land during the modularize wave.

- Add `display_name` to `user_preferences` (snapshot, RLS-consistent with the table).
- `get_shared_note` anon RPC joins and returns the author display name alongside note title/body.
- On signed-in session / prefs sync, write `display_name` from Clerk: `fullName` → first+last → username fallback.
- Share Card SSR (later slice) reads this via the anon RPC only — never Clerk Backend on the crawler path.

## Acceptance criteria

- [ ] Migration adds `user_preferences.display_name`; both generated + re-exported DB type defs updated
- [ ] `get_shared_note` returns author display name for a shared note; null-safe when unset
- [ ] Signed-in session/prefs sync writes display name with `fullName` → first+last → username precedence
- [ ] Anon RPC path makes no Clerk Backend call

## Blocked by

None - can start immediately.
