<div align="center">
  <h1>Madrid</h1>
</div>

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/mrlemoos/madrid?utm_source=oss&utm_medium=github&utm_campaign=mrlemoos%2Fmadrid&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Philosophy

You know the feeling: you open something to think, and the software starts performing (offering, suggesting, nudging) until the room for your own pace shrinks. Useful automation has its place elsewhere; in a notes app, that itch to always _do something next_ can mistake motion for thinking.

[Madrid](https://getmadrid.app) treats your attention as something to **protect**, not to harvest. It gives you a steady place to write and arrange ideas, and it steps back when you pause so your mind can do the unglamorous part: wandering, revising, waiting for the right phrase without the product trying to entertain the lull.

We leave silence alone on purpose. Boredom at the cursor is the sound of a thought catching up.

## What it is

![A macOS screenshot of the welcome screen of Madrid with a button to start.](assets/welcome-screen.png 'Welcome screen')

Madrid is a personal notes app built as an [Nx](https://nx.dev) monorepo.

The main client ([apps/nota](apps/nota)) is a **Next.js** App Router app with **React 19**. It also serves the API routes under `src/app/api/*` (entitlement, link previews, semantic search, assistive capture).

Notes use **Supabase** (Postgres, Storage, and row-level security) with **Clerk** for sign-in (third-party JWTs). The editor is **TipTap** (ProseMirror).

Subscriptions use **Clerk Billing** (in-app checkout; server-side entitlement checks in the Next route handlers).

An **Electron** desktop shell wraps the same build—see [apps/nota-electron/README.md](apps/nota-electron/README.md). The public marketing site lives in [apps/nota-marketing](apps/nota-marketing) (Astro).

## Requirements

- **Node.js** 22 or newer (see root `package.json` `engines`)
- **pnpm** 10.x (see root **`packageManager`** in [`package.json`](package.json); [`pnpm-workspace.yaml`](pnpm-workspace.yaml) lists workspace packages)

## Install

From the repository root:

```sh
corepack enable pnpm
pnpm install
```

## Environment

Copy [apps/nota/.env.example](apps/nota/.env.example) to `apps/nota/.env` and set at least:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase publishable key (`sb_publishable_…`)

For Clerk sign-in and subscription flows, follow the same file for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and the **server-only** secrets (`CLERK_SECRET_KEY`, `SUPABASE_SECRET_KEY`, etc.—never commit real values, never prefix them `NEXT_PUBLIC_`). Schema, RLS policies, and migrations are applied in Supabase from the SQL in this repo—environment variables alone do not create the database.

## Database

SQL migrations live under [supabase/migrations/](supabase/migrations/) at the repository root. If you use the [Supabase CLI](https://supabase.com/docs/guides/cli), link your project and apply migrations with your usual workflow (for example `supabase db push` against a linked project, or local `supabase start` for development).

## Run the web app

```sh
pnpm exec nx dev @getmadrid/nota
```

(`pnpm exec nx dev nota` resolves to the same project.)

The Next dev server listens on **[http://localhost:3000](http://localhost:3000)**.

## Marketing site (local)

```sh
pnpm exec nx run @getmadrid/nota-marketing:dev
```

## Build and test

```sh
pnpm exec nx build @getmadrid/nota
pnpm exec nx test @getmadrid/nota
```

Tests use **Vitest** via the Nx Vitest plugin.

## Electron

The desktop app expects the web dev server at `http://localhost:3000` (`DEV_PORT` in [apps/nota-electron/src/app-load-url.ts](apps/nota-electron/src/app-load-url.ts)). From the repository root you can run:

- `pnpm run electron:dev` — Electron only (start the web app in another terminal with `pnpm exec nx dev @getmadrid/nota`, or run `pnpm exec nx run-many -t dev` to start the web app and Electron together)

More detail: [apps/nota-electron/README.md](apps/nota-electron/README.md).

## Repository layout

| Path                   | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `apps/nota/`           | Main Next.js app (notes, auth, TipTap, API routes) |
| `apps/nota-electron/`  | Electron shell                                     |
| `apps/nota-marketing/` | Astro marketing site                               |
| `supabase/`            | Supabase config and SQL migrations                 |
| `assets/`              | Shared assets (e.g. screenshots for docs)          |

## Licence

Apache License 2.0 — see [LICENSE](LICENSE) and [package.json](package.json).
