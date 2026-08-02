# Shared Note SSR /s/[token] Share Cards (static og:image)

Status: ready-for-agent

## Parent

ADR 0003 — [`docs/adr/0003-nextjs-share-cards-and-path-routing.md`](../../../docs/adr/0003-nextjs-share-cards-and-path-routing.md) §4

## What to build

Server-render `/s/[token]` so crawlers get real HTML + Open Graph unfurls, while open viewers keep live updates. Uses the anon `get_shared_note` RPC only — no Clerk Backend call on the crawler path.

- Document `<title>`: `{title}–Nota` (en-dash). Empty title → Untitled Note label.
- `og:title`: `{author} shared {title}`; no author display name → `{title}` only (author from issue 01).
- Body: plain-text excerpt via `@nota/note-doc-plain-text`; TipTap read-only hydrates client-side.
- Live broadcast subscription on `share:{token}` unchanged (refetch on broadcast).
- `og:image`: static Nota brand asset (per-note dynamic `next/og` deferred to issue 06).

## Acceptance criteria

- [ ] First HTML response contains note title + OG tags (no empty shell)
- [ ] `<title>` = `{title}–Nota`; empty title → Untitled Note label
- [ ] `og:title` = `{author} shared {title}`, falls back to `{title}` when no author
- [ ] Plain-text excerpt rendered server-side; TipTap read-only hydrates client-side
- [ ] Live broadcast refetch still works for open viewers
- [ ] Static Nota brand `og:image` set; no Clerk Backend call on the crawler path

## Blocked by

- Issue 01 (Author Display Name snapshot + Clerk sync)
- Issue 02 (Next.js App Router cutover skeleton)
