# 4. Absorb `nota-server` into the Next app and delete it

Date: 2026-08-15

Status: Accepted

Supersedes point 6 of [ADR 0003](0003-nextjs-share-cards-and-path-routing.md).

## Context

ADR 0003 point 6 kept `apps/nota-server` (an Express service on Railway) alive through
the Vite → Next cutover, and recorded "absorb `nota-server` in the same cutover" as a
rejected option: larger blast radius, deferred explicitly. The stated intent was to move
those APIs into the Next app afterwards.

That follow-up happened incrementally and was already complete before this ADR. All nine
endpoints had been reimplemented as App Router route handlers, and every shared server
lib existed twice — the copies under `apps/nota/src/server/` were byte-identical to their
`apps/nota-server/src/lib/` originals for `og-preview`, `semantic-search-query`,
`user-rate-limit`, `xai-audio-note`, `audio-upload`, `nota-server-error-detail`,
`semantic-embeddings`, `note-plain-text`, and `flight`. Nothing deployed consumed the
Express service; `apps/nota/src/lib/nota-server-client.ts` had already been rewritten to
fetch same-origin.

What remained was a duplicate that no longer ran, and the drift it caused:

- Three client call sites still gated features on `NEXT_PUBLIC_NOTA_SERVER_API_URL`,
  which is unset. Semantic search, index-on-save, and release notes were **silently
  disabled** in production — the var's absence reads as "not configured", not as an
  error.
- `apps/nota-server/.gitignore` was the only rule covering `apps/nota-server/.env`, a
  file holding real secrets.

## Decision

1. **Delete `apps/nota-server`**, along with its deployment surface: `railway.json`,
   `infra/Dockerfile.nota-server`, `tools/railway-nota-server-build.sh`, and the
   `oven-sh/setup-bun` CI step that existed only for its `bun test` suite.

2. **All API endpoints are same-origin** route handlers under `apps/nota/src/app/api/*`,
   authenticated by the Clerk session cookie via `clerkMiddleware`. There is no base URL
   to configure and no Bearer token attached from the web client. `/api/flight` stays
   public with per-IP rate limiting, per ADR 0001.

3. **`NEXT_PUBLIC_NOTA_SERVER_API_URL` and `notaServerBaseUrl()` are removed.** A feature
   must not be gated on an env var whose absence disables it silently.

4. **Server-lib specs move with their subject** into `apps/nota/src/server/` as Vitest,
   replacing `bun test`. Specs whose subject did not survive (the Express→Web request
   adapters in `http-utils`, and `clerk-billing.server` — replaced by a differently
   shaped `nota-pro-entitlement`) are dropped rather than retargeted.

5. **`validate:billing` moves to `nx run @getmadrid/nota:validate-billing`**, reading
   `apps/nota/.env`. It still runs under `bun`; it is a manual dev tool, not a CI task.

6. **`@getmadrid/nota-server-client` stays** for `apps/nota-mobile`, which is not same-origin
   and needs an absolute base URL plus a Bearer token. Its name now describes the web
   app origin it points at, not a separate service.

7. **Local env files are ignored repo-wide** (`**/.env`, `**/.env.*`, with
   `!**/.env.example`), so deleting an app can never un-ignore its secrets.

## Consequences

- One deployment instead of two. The Railway service should be torn down; nothing builds
  or deploys there.
- `CLERK_SECRET_KEY` now belongs **on the `apps/nota` Vercel project**. ADR 0003's
  consequence ("prefer keeping `CLERK_SECRET_KEY` off the app until absorb needs it") is
  discharged: absorb needs it. `SUPABASE_SECRET_KEY` is required there too — the server
  routes query with no user JWT, and every RLS policy is scoped `TO authenticated`, so a
  publishable key returns zero rows **without raising an error**.
- The former `NOTA_SERVER_CORS_ORIGINS` allowlist is gone. Browser clients are
  same-origin so they need none; `apps/nota-mobile` is a native client not subject to
  CORS, but its Bearer path against `auth()` has no automated coverage.
- Semantic search, semantic index-on-save, and Electron release notes become reachable
  again once their keys are set, having been inert while gated on the unset base URL.

## Considered options (rejected)

- **Keep `nota-server` as the API and point the Next app at it** — reinstates a second
  deployment, a CORS allowlist, and Bearer plumbing for endpoints already duplicated and
  working same-origin.
- **Keep the package but empty it** — leaves a project in the Nx graph, an eslint
  boundary tag, and a `bun test` toolchain for no runtime.
- **Amend ADR 0003 in place** — the deferral was a real decision with real consequences
  at the time; recording its discharge separately preserves that history.
