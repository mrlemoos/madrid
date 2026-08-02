# Next.js App Router cutover skeleton

Status: ready-for-human

## Parent

ADR 0003 — [`docs/adr/0003-nextjs-share-cards-and-path-routing.md`](../../../docs/adr/0003-nextjs-share-cards-and-path-routing.md) §1, Consequences

## What to build

Migrate `@nota/nota` from the Vite static SPA to Next.js App Router as the platform for path routing and Share Card SSR. Skeleton only: framework, build/deploy model, base layout, Clerk App Router integration — no feature migration yet.

HITL: framework swap + deploy-model change (Vercel Next instead of static `index.html` SPA rewrites), CSP and env moves. Requires human architectural sign-off. Gated on the modularize wave (ADR 0002) landing first.

- Next App Router app boots with base layout and Clerk App Router provider.
- Vercel project becomes a Next deploy; CSP and env (`CLERK_*`, Supabase anon, Nota API URL) move with the app. Keep `CLERK_SECRET_KEY` off the app until absorb needs it.
- **CSP:** check current Next.js docs, then port the existing `vercel.json` CSP (Clerk Frontend API origin, PostHog `https://*.i.posthog.com`, `worker-src 'self' blob:`, Supabase) into `next.config.ts` headers. Next `next/og` + inline hydration may need CSP overrides (e.g. `script-src` nonce/`unsafe-inline`, `img-src` for OG). Document what had to be overridden and why.
- Electron unchanged in role (loads hosted origin).

## Acceptance criteria

- [ ] Next App Router app builds and serves with base layout + Clerk provider
- [ ] Vercel deploy is Next (no static SPA rewrite as primary model); env + CSP migrated
- [ ] CSP ported to `next.config.ts` headers per current Next.js docs; any overrides (OG, hydration, worker-src) documented
- [ ] `CLERK_SECRET_KEY` remains off the app project
- [ ] Electron still loads the hosted web origin unchanged
- [ ] Human review/sign-off on framework + deploy model recorded

## Blocked by

None to start, but must not merge before the modularize wave (ADR 0002) lands.
