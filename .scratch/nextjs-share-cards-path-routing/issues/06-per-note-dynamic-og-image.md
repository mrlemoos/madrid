# Per-note dynamic next/og image

Status: ready-for-agent

## Parent

ADR 0003 — [`docs/adr/0003-nextjs-share-cards-and-path-routing.md`](../../../docs/adr/0003-nextjs-share-cards-and-path-routing.md) §4

## What to build

Replace the static Nota brand `og:image` on `/s/[token]` with a per-note dynamic image rendered via `next/og`, showing note title and author display name.

## Acceptance criteria

- [ ] `/s/[token]` emits a per-note `og:image` rendered by `next/og`
- [ ] Image shows note title; author display name when present
- [ ] Falls back to static brand asset on render failure
- [ ] Uses anon RPC data only — no Clerk Backend call on the crawler path

## Blocked by

- Issue 04 (Shared Note SSR /s/[token] Share Cards)
