# 3. Migrate `@nota/nota` to Next.js for Share Cards and path routing

Date: 2026-08-01

Status: Accepted (point 6 superseded by [ADR 0004](0004-absorb-nota-server-into-the-next-app.md))

## Context

Shared notes live at `/s/{token}` and load entirely in the client (`SharedNoteView` +
anon `get_shared_note` RPC). The hosted app is a static Vite SPA on Vercel, so crawlers
see an empty shell — no Open Graph tags with note title or author. TipTap “link preview”
OG fetch on `nota-server` is unrelated (external URLs inside the editor).

We want Share Cards (unfurls) that show the author’s name and note title, plus a real
first HTML response for visitors, while keeping live updates for open viewers (Realtime
broadcast on `share:{token}` → refetch). Electron continues to load the hosted web origin.

A full Vite → Next rewrite was chosen over a thin `/s/*`-only SSR slice so path routing,
Clerk’s App Router integration, and eventual consolidation of `nota-server` into the main
app share one platform.

## Decision

1. **Migrate `@nota/nota` from Vite SPA to Next.js App Router** after the modularize wave
   (ADR 0002) lands. Order: **modularize → Next**. Author Display Name DB/RPC work may
   land during modularize; Share Card HTML waits for the Next cutover.

2. **Path routing** replaces hash notes navigation. Canonical note URL = `/notes/[id]`
   (aligned with `@nota/internal-note-link`). Legacy `#/notes/…` and `#/notes/note/:id`
   redirect to paths at boot/middleware. Auth stays on pathnames.

3. **Signed-in `/notes/**` is a Notes Client Shell** — client-rendered vault, editor, and
   chrome inside App Router layouts. Do not SSR note bodies or the vault. Prefetch =
   vault list plus Next route shells for **visible/recent\*\* note ids (not every body,
   not unbounded all-id prefetch).

4. **Shared Note route `/s/[token]` is server-rendered for Share Cards**:
   - Document `<title>`: `{title}–Nota` (en-dash). Empty title → Untitled Note label.
   - `og:title`: `{author} shared {title}`; if no Author Display Name → `{title}` only.
   - Body: plain-text excerpt from note content (`@nota/note-doc-plain-text`); TipTap
     read-only hydrates client-side; live broadcast subscription unchanged.
   - `og:image`: static Nota brand asset first; per-note dynamic `next/og` later.

5. **Author Display Name** is a snapshot on `user_preferences.display_name`, joined in
   `get_shared_note`. Sync from Clerk on signed-in session/prefs (`fullName` →
   first+last → username). Share Card SSR uses the anon RPC only — no Clerk Backend
   call on the crawler path.

6. **`nota-server` stays** through the Next cutover (entitlement, external link OG fetch,
   assistive capture). **Intent:** later move those APIs into the Next app (Route
   Handlers / server modules). Share Card SSR is not a reason to grow `nota-server`.

   > **Superseded by [ADR 0004](0004-absorb-nota-server-into-the-next-app.md)
   > (2026-08-15).** The deferred follow-up landed: the APIs are Route Handlers in
   > `apps/nota/src/app/api/*` and `apps/nota-server` is deleted.

7. **Electron unchanged** in role: loads the hosted app URL; share links already point at
   `VITE_NOTA_WEB_APP_ORIGIN` / prod web origin.

## Consequences

- Vercel project for `apps/nota` becomes a Next deploy (no static `index.html` SPA
  rewrite as the primary model). CSP and env (`CLERK_*`, Supabase anon, Nota API URL)
  move with the app; Prefer keeping `CLERK_SECRET_KEY` off the app until absorb needs it.
- `app-navigation-*` and Clerk hash wiring are rewritten for path App Router.
- Glossary terms for sharing live in [`apps/nota/CONTEXT.md`](../../apps/nota/CONTEXT.md).

## Considered options (rejected for this cutover)

- **SSR only `/s/*` on Vite** — ships Share Cards cheaper, but delays path routing and
  Clerk/Next consolidation we already want.
- **Author name via Clerk Backend on each Share Card request** — fresh names, but crawler
  latency and Clerk dependency; snapshot preferred.
- **Absorb `nota-server` in the same cutover** — larger blast radius; deferred explicitly.
