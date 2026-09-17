# 03 — Extract `@getmadrid/note-doc-plain-text` (shared) and drop the marketing alias

**What to build:** A standalone `platform:shared` buildable lib `@getmadrid/note-doc-plain-text`
containing the TipTap-doc → plain-text helper. Both `apps/nota` and `apps/nota-marketing`
consume it directly, and the current Astro alias to the app helper is removed.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Buildable lib per the house pattern; tagged `scope:getmadrid`, `type:util`, `platform:shared`
- [x] Pure — imports no web-only package; boundaries lint passes
- [x] Characterization tests cover the doc→text behaviour (add if missing) at the package entrypoint
- [x] `apps/nota` and `apps/nota-marketing` import `@getmadrid/note-doc-plain-text`; the marketing `astro.config` alias is deleted
- [x] Original app copy deleted; `nx run-many -t build lint test` green

## Comments

- Verified during ticket 14's audit: `packages/note-doc-plain-text/src` holds
  `note-doc-plain-text.ts` + spec; `apps/nota/src/lib/note-doc-plain-text.ts` no longer
  exists. `apps/nota-marketing`'s `astro.config.mjs` has no alias for this helper any more
  (only the unrelated `@` → `src` alias remains); `apps/nota-marketing/package.json` and
  `tsconfig.json` reference `@getmadrid/note-doc-plain-text` directly via `workspace:*`.
- Note: `apps/nota-marketing` currently has no source file that imports the plain-text
  helper (dependency declared but unused in `src/`) — pre-existing, not introduced by this
  change, and out of scope for ticket 14 to chase.
