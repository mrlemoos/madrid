# Prefetch: vault list + route shells for visible/recent ids

Status: ready-for-agent

## Parent

ADR 0003 — [`docs/adr/0003-nextjs-share-cards-and-path-routing.md`](../../../docs/adr/0003-nextjs-share-cards-and-path-routing.md) §3

## What to build

Make `/notes/[id]` navigation feel instant without over-fetching. Prefetch = vault list plus Next route shells for visible/recent note ids only. Not every body, not an unbounded all-id prefetch.

## Acceptance criteria

- [ ] Vault list is prefetched
- [ ] Route shells prefetched only for visible/recent note ids (bounded)
- [ ] No note-body prefetch; no unbounded all-id prefetch
- [ ] Navigating to a recent/visible note resolves without a cold fetch

## Blocked by

- Issue 03 (Path routing: /notes/[id] + Notes Client Shell)
