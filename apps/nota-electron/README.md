# Nota Electron Shell

Desktop wrapper for nota using Electron.

## Development

1. Start the Vite dev server (in another terminal), from the monorepo root:

   ```bash
   pnpm exec nx dev @nota/nota
   ```

2. Run Electron, from the monorepo root:

   ```bash
   pnpm exec nx dev @nota/nota-electron
   ```

   Or start **Vite and Electron together** (both expose a `dev` target):

   ```bash
   pnpm exec nx run-many -t dev
   ```

## Production build (local)

From the monorepo root, pack macOS artefacts without publishing (no GitHub token required):

```bash
pnpm exec nx run @nota/nota-electron:electron:pack
```

Or the equivalent shorthand:

```bash
pnpm run electron:pack
```

`electron-builder` copies `../nota/dist` into the app bundle. Output is under `apps/nota-electron/release/` (DMG and ZIP per architecture). **macOS** is required for the current `electron-builder.yml` targets.

## Publish to GitHub Releases (local)

Set **`GH_TOKEN`** or **`GITHUB_TOKEN`** to a token with **`repo`** scope (classic PAT or fine-grained with contents read/write for this repository). Then from the monorepo root:

```bash
pnpm run release:electron
```

Same as:

```bash
pnpm exec nx run @nota/nota-electron:electron:release
```

Optional: bump `apps/nota-electron/package.json` for this run only (same as CI’s **`pnpm pkg set version=…`**):

```bash
pnpm exec nx run @nota/nota-electron:electron:release -- --version 1.2.3
```

If you omit `--version`, the version already in `apps/nota-electron/package.json` is used.

## GitHub Releases and auto-updates

- **`electron-builder`** is configured with **`publish.provider: github`** (`owner` / `repo` in `electron-builder.yml`). Packaged apps embed **`app-update.yml`** for **`electron-updater`**.
- **`main.ts`** wires **`registerNotaUpdaterIpc()`** / **`startPackagedNotaUpdater()`** ([`nota-updater.ts`](src/nota-updater.ts)): **`checkForUpdates()`** on launch (no duplicate OS notify), status events to the renderer, **`quitAndInstall(false, true)`** after download. **Settings** ([`electron-update-settings-section.tsx`](../nota/src/components/electron-update-settings-section.tsx)) calls the same check path via preload.
- **CI**: `.github/workflows/release-electron.yml` runs on **`v*`** tags and on **`workflow_dispatch`** (semver + **release kind**: production vs release candidate / draft). It syncs `apps/nota-electron/package.json` version, then runs **`pnpm exec nx run @nota/nota-electron:electron:release`** (build + **`electron-builder --publish always`** via [`tools/electron-github-release.mjs`](../../tools/electron-github-release.mjs)). Actions sets **`GH_TOKEN`** from **`GITHUB_TOKEN`** to upload assets and `latest-mac.yml`.

### Required secrets (embedded SPA, CI)

The **`macos` job** in [`.github/workflows/release-electron.yml`](../../.github/workflows/release-electron.yml) uses **`environment: Production`**, so **`${{ secrets.* }}`** resolves **Production environment secrets** first (and repository secrets where you do not override by name). Define the `VITE_*` keys there (or duplicate them as **repository** secrets if you prefer not to use an environment). Mirror Vercel / [`apps/nota/.env.example`](../nota/.env.example). **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** are required: the workflow **fails** if either is unset so the app cannot ship with a broken login. Other `VITE_*` secrets may still be empty (features degrade until you add them).

If **Production** has protection rules (required reviewers, wait timers), each release run waits for them before the build starts.

| Secret                       | Purpose                                                                                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`          | Supabase project URL                                                                                                                                                                                                              |
| `VITE_SUPABASE_ANON_KEY`     | Supabase anon (public) key                                                                                                                                                                                                        |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (same instance as the web app)                                                                                                                                                                              |
| `VITE_NOTA_SERVER_API_URL`   | **Required** for Nota Pro and link previews: nota-server HTTPS origin, no trailing slash (production Railway example: `https://notaappnota-server-production.up.railway.app`). OG fetch runs on the server, not in the SPA build. |

### Triggering CI release

- **Tag (published release):** `git tag v1.2.3 && git push origin v1.2.3`
- **Tag (release candidate → GitHub draft):** use a semver **prerelease** after the patch, e.g. `git tag v1.2.3-rc.1 && git push origin v1.2.3-rc.1` (any `vMAJOR.MINOR.PATCH-<prerelease>` form). CI sets **`EP_DRAFT=true`** for **electron-builder** so the GitHub release is a **draft**.
- **Manual:** **Actions → Release Electron (macOS) → Run workflow**, enter semver (e.g. `1.2.3` or `1.2.3-rc.1`), then choose **release kind**: **production** (published) or **release candidate** (draft).

**Local draft publish:** `pnpm exec nx run @nota/nota-electron:electron:release -- --draft` (forwards **`--draft`** to [`tools/electron-github-release.mjs`](../../tools/electron-github-release.mjs)).

Confirm the new **Release** lists DMG and ZIP assets per architecture plus **`latest-mac.yml`** (used by auto-update). Draft releases stay off the default “latest” path until you publish them on GitHub.

After fixing secrets, **push a new `v*` tag** or run **Release Electron (macOS)** again via **workflow_dispatch** so a fresh build picks up the values.

### Packaged app: “Missing Supabase environment variables”

That message comes from [`apps/nota/src/lib/supabase/browser.ts`](../nota/src/lib/supabase/browser.ts): the **Vite build** inlined empty `VITE_SUPABASE_*` strings. GitHub Actions does not inject secrets at runtime on the user’s machine.

1. Add **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** under **Production** environment secrets (or **repository** secrets), with those exact names — this workflow reads `${{ secrets.* }}` only.
2. If the URL lives under **Variables**, either duplicate it into **Secrets** or change the workflow to use `${{ vars.VITE_SUPABASE_URL }}` for that key.
3. Trigger a **new** release build (tag or manual workflow); re-download the app.

### Optional secrets (macOS signing / notarisation)

Store these as **repository** secrets or under the same **Production** environment, matching the names below.

| Secret                        | Purpose                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `MAC_CSC_LINK`                | Base64-encoded `.p12` (Developer ID Application)           |
| `MAC_CSC_KEY_PASSWORD`        | `.p12` password; also **`CSC_KEY_PASSWORD`** for the build |
| `APPLE_ID`                    | Apple ID email (for notarisation, when enabled)            |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password                                      |
| `APPLE_TEAM_ID`               | Team ID                                                    |

With `MAC_CSC_LINK` unset, CI still produces **unsigned** artefacts. Set **`mac.notarize: true`** in `electron-builder.yml` when the Apple ID secrets above are configured.

## macOS Dock icon

The Dock icon follows **system light/dark**: [`buildResources/icon.png`](buildResources/icon.png) from [`icon-light.svg`](buildResources/icon-light.svg) (Tahoe-safe margins and light chrome), and [`buildResources/icon-dark.png`](buildResources/icon-dark.png) from [`icon-dark.svg`](buildResources/icon-dark.svg). Run **`pnpm run generate:nota-icons`** from the repo root after editing either SVG; [`src/main.ts`](src/main.ts) applies **`app.dock.setIcon`** on launch and when **`nativeTheme`** changes. The app bundle **`.icns`** remains built from **`icon.png`**. Vitest checks the committed PNG safe zone in [`../nota/scripts/dock-icon-metrics.spec.mjs`](../nota/scripts/dock-icon-metrics.spec.mjs).

## Architecture

- **Dev mode**: Loads from `http://localhost:4200` (Vite dev server).
- **Prod mode (packaged)**: Loads **`https://app.nota.mrlemoos.dev`** — the same deployed **`nota`** SPA as the web client ([`src/app-load-url.ts`](src/app-load-url.ts)). Release builds still embed **`nota/dist`** via `electron-builder` until that dependency is removed.
- **Link preview**: Same as the web app—the SPA calls **`nota-server`** `GET /api/og-preview` using **`VITE_NOTA_SERVER_API_URL`** and the Clerk session JWT. **`CLERK_SECRET_KEY`** belongs only on the **`nota-server`** host, not in the Electron or Vercel SPA builds.
- **Nota Pro entitlement**: The deployed app must be built with **`VITE_NOTA_SERVER_API_URL`** pointing at **[`nota-server`](../nota-server)**. Ensure **`NOTA_SERVER_CORS_ORIGINS`** on the server includes **`https://app.nota.mrlemoos.dev`** when you use an explicit allowlist.
- **Clerk session tokens in Electron**: Packaged builds load **`https://app.nota.mrlemoos.dev`** and call the Clerk Frontend API on **`https://clerk.nota.mrlemoos.dev`**. If Chromium logs a CORS error on `/v1/client/sessions/.../tokens`, confirm the Clerk **custom domain** DNS record is **DNS only** (not proxied through Cloudflare) per [Clerk production DNS](https://clerk.com/docs/guides/development/deployment/production). The shell also patches missing `Access-Control-Allow-Origin` on Clerk FAPI responses via [`clerk-fapi-cors.ts`](src/clerk-fapi-cors.ts) (`session.webRequest.onHeadersReceived`).
