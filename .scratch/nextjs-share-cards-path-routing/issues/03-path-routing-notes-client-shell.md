# Path routing: /notes/[id] + Notes Client Shell + legacy hash redirect

Status: ready-for-agent

## Parent

ADR 0003 — [`docs/adr/0003-nextjs-share-cards-and-path-routing.md`](../../../docs/adr/0003-nextjs-share-cards-and-path-routing.md) §2, §3

## What to build

Replace hash notes navigation with path routing under App Router. Canonical note URL = `/notes/[id]` (aligned with `@getmadrid/internal-note-link`). Signed-in `/notes/**` is a client-rendered Notes Client Shell — vault, editor, chrome inside App Router layouts. Do NOT SSR note bodies or the vault.

- `/notes/[id]` renders the client shell; note body/vault stay client-rendered.
- Legacy `#/notes/…` and `#/notes/note/:id` redirect to paths at boot/middleware.
- Auth stays on pathnames.
- `app-navigation-*` and Clerk hash wiring rewritten for path App Router.

## Acceptance criteria

- [ ] `/notes/[id]` loads the note in the client shell; vault + body are client-rendered (not SSR)
- [ ] Legacy hash routes redirect to canonical paths at boot/middleware
- [ ] Auth guards operate on pathnames
- [ ] Navigation helpers + Clerk wiring no longer depend on hash routing

## Blocked by

- Issue 02 (Next.js App Router cutover skeleton)
