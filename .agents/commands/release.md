# Release

Trigger **Release Electron (macOS)** in GitHub Actions (`.github/workflows/release-electron.yml`). That workflow builds the SPA, runs **`pnpm exec nx run @nota/nota-electron:electron:release`** (via [`tools/electron-github-release.mjs`](../../tools/electron-github-release.mjs)), and publishes macOS assets to GitHub Releases.

## Before anything else

**Ask the user** which kind of release this is:

| User choice           | GitHub Releases behaviour                                                                                                                                                                                                   | How CI picks it                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Release candidate** | **Draft** release (assets attached; not shown as the repo’s latest public release until you edit the release and publish). Safer for testers; **electron-updater** does not treat draft releases as the normal update feed. | Manual workflow: set **Release kind** to **release candidate**. Tag push: use a **semver prerelease** tag (see below). Local: pass **`--draft`** to the release script.                     |
| **Production**        | **Published** (non-draft) release — the usual “ship it” path.                                                                                                                                                               | Manual workflow: **Release kind** = **production** (default). Tag push: use a **release** semver tag only (`vMAJOR.MINOR.PATCH` with no `-` prerelease segment). Local: omit **`--draft`**. |

If the user has not decided, stop and wait for their answer before suggesting tags, Actions inputs, or local commands.

## When the workflow runs

| Trigger      | What starts the job                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tag push** | Any push of a git tag matching **`v*`** (e.g. `v1.2.3` or `v1.2.3-rc.1`). The workflow strips the leading **`v`** and runs **`pnpm pkg set "version=…"`** in `apps/nota-electron` with that semver. **Draft vs published** is inferred from the tag (see table above): a **prerelease** form `MAJOR.MINOR.PATCH-<anything>` (hyphen after the patch number) sets **`EP_DRAFT=true`** for **electron-builder** so the GitHub release is created as a **draft**. |
| **Manual**   | **Actions → Release Electron (macOS) → Run workflow** (`workflow_dispatch`). Inputs: **version** (semver, no `v` prefix, e.g. `1.2.3` or `1.2.3-rc.1`) and **release kind** (**production** or **release candidate**).                                                                                                                                                                                                                                         |

The job uses **`environment: Production`**; **`secrets.*`** (and optional signing env) resolve from that environment first. See **`apps/nota-electron/README.md`** (required **`VITE_*`** keys, optional Apple signing).

## Tag-based release

1. **Inspect existing release tags** (avoid duplicates):

   ```bash
   git fetch --tags origin
   git tag -l 'v*' --sort=-v:refname | head
   ```

   Or: `git ls-remote --tags origin 'refs/tags/v*'`

2. **Choose the next semver** on the commit you want to ship (usually **`main`** after merge):
   - **Production:** `v1.2.3` (no hyphen after the patch triplet).
   - **Release candidate (draft on GitHub):** include a semver prerelease after the patch, e.g. **`v1.2.3-rc.1`**, **`v1.2.3-beta.2`** (`v1.2.3-`… pattern).

   ```bash
   git tag vX.Y.Z[-prerelease]
   git push origin vX.Y.Z[-prerelease]
   ```

   Pushing the tag triggers Actions; there is no separate “run workflow” step for this path.

## Manual run (no new tag)

Use when you want CI to build from the **selected branch** without adding a tag:

1. Open **[Release Electron (macOS) on GitHub Actions](https://github.com/mrlemoos/nota/actions/workflows/release-electron.yml)** (or **Actions** → **Release Electron (macOS)**).
2. **Run workflow**, pick the branch, enter **version** (semver only, e.g. `1.2.3` or `1.2.3-rc.1`).
3. Set **release kind** to **production** or **release candidate** to match what the user chose above.
4. Confirm the run under **Production** if the environment has protection rules.

## Local publish (optional)

From the repo root, with **`GH_TOKEN`** or **`GITHUB_TOKEN`** set (see **`apps/nota-electron/README.md`**):

- **Production:** `pnpm run release:electron` (or `pnpm exec nx run @nota/nota-electron:electron:release`).
- **Release candidate (draft):** `pnpm exec nx run @nota/nota-electron:electron:release -- --draft` (same as adding **`--draft`** after the script args forwarded to **`electron-github-release.mjs`**).

## After the run

Confirm the GitHub **Release** is in the expected state (**Draft** badge vs published). Check DMG and ZIP per target architecture plus **`latest-mac.yml`** where applicable. If **`VITE_*`** secrets were wrong or empty, fix secrets and **trigger a new run**; rebuilt artefacts are required for the packaged app to pick up env.
