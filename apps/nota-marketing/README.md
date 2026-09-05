# Madrid marketing site (Astro)

Static marketing pages: download links (GitHub Releases), pricing copy, and product screenshots. Screenshots live in [`src/assets/marketing/`](src/assets/marketing/) and are rendered with [`Image` from `astro:assets`](https://docs.astro.build/en/guides/images/) so the build emits optimised formats (e.g. WebP).

## Vercel

Create a **separate** project from the main app. Set **Root Directory** to `apps/nota-marketing`. The included `vercel.json` runs `pnpm install --frozen-lockfile` from the monorepo root and builds with Nx so workspace dependencies resolve. **Output directory:** `dist` (relative to the app root).

Requires **Node.js 22+** (see root `package.json` `engines`).

## Local

From the repository root:

```bash
pnpm install
pnpm exec nx run @getmadrid/nota-marketing:dev
```

## Clerk Billing alignment (operators)

Checkout and plan tiles in the app come from **Clerk Billing** (`PricingTable` in `apps/nota`). Marketing copy in `src/pages/pricing.astro` and `src/pages/index.astro` must stay in sync with what you configure in Clerk.

1. In the [Clerk Dashboard](https://dashboard.clerk.com), open the Madrid application (same project as production `VITE_CLERK_PUBLISHABLE_KEY`).
2. Under **Billing** (or **Commerce** / **Monetization**), set every customer-facing price to **USD** in Stripe and remove or archive any **$0 / free** plan so only paid monthly, annual, and (if used) lifetime remain.
3. Match amounts to the **USD guide figures** on `/pricing` (see `pricing.astro` constants). If you change Clerk prices, update the Astro pages and JSON-LD in the same commit.
4. **Verify:** compare the plan list in Clerk → **Settings → Subscription** (or the paywall) in a dev/staging build → page source JSON-LD on `/pricing`. Optional: Stripe Dashboard → **Products** for the linked prices.

There must be **no free plan**: nothing at $0 and no unpaid tier that unlocks the same vault as Madrid Pro.
