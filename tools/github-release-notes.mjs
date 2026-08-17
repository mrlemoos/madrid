#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * @typedef {{ id: number, tag_name: string, assets?: unknown[] }} GithubRelease
 */

/**
 * Prefer the GitHub release that already has artefacts. Duplicate rows for the
 * same tag (electron-builder race) make later PATCHes 422 "tag_name already exists".
 *
 * @param {GithubRelease[]} releases
 * @param {string} tag
 * @returns {GithubRelease | null}
 */
export function pickReleaseToKeep(releases, tag) {
  const matches = releases.filter((release) => release.tag_name === tag);
  if (matches.length === 0) return null;
  return matches.slice().sort((a, b) => {
    const assetDelta = (b.assets?.length ?? 0) - (a.assets?.length ?? 0);
    if (assetDelta !== 0) return assetDelta;
    return a.id - b.id;
  })[0];
}

/**
 * @param {GithubRelease[]} releases
 * @param {string} tag
 * @returns {number[]}
 */
export function duplicateReleaseIds(releases, tag) {
  const keep = pickReleaseToKeep(releases, tag);
  if (!keep) return [];
  return releases
    .filter((release) => release.tag_name === tag && release.id !== keep.id)
    .map((release) => release.id);
}

/**
 * @param {object} opts
 * @param {typeof fetch} opts.fetchImpl
 * @param {string} opts.repo
 * @param {string} opts.token
 * @param {string} path
 * @param {RequestInit} [init]
 */
async function githubJson(opts, path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/vnd.github+json');
  headers.set('Authorization', `Bearer ${opts.token}`);
  headers.set('X-GitHub-Api-Version', '2022-11-28');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await opts.fetchImpl(
    `https://api.github.com/repos/${opts.repo}${path}`,
    { ...init, headers },
  );
  return response;
}

/**
 * @param {object} args
 * @param {typeof fetch} args.fetchImpl
 * @param {string} args.repo
 * @param {string} args.tag
 * @param {string} args.title
 * @param {string} args.target
 * @param {boolean} args.draft
 * @param {string} args.token
 */
export async function ensureGithubRelease(args) {
  const existing = await githubJson(args, `/releases/tags/${args.tag}`);
  if (existing.ok) {
    return /** @type {GithubRelease} */ (await existing.json());
  }
  if (existing.status !== 404) {
    const detail = await existing.text();
    throw new Error(
      `GET release ${args.tag} failed: ${String(existing.status)} ${detail}`,
    );
  }
  const created = await githubJson(args, '/releases', {
    method: 'POST',
    body: JSON.stringify({
      tag_name: args.tag,
      name: args.title,
      target_commitish: args.target,
      draft: args.draft,
      body: '',
    }),
  });
  if (!created.ok) {
    const detail = await created.text();
    throw new Error(
      `POST release ${args.tag} failed: ${String(created.status)} ${detail}`,
    );
  }
  return /** @type {GithubRelease} */ (await created.json());
}

/**
 * @param {object} args
 * @param {typeof fetch} args.fetchImpl
 * @param {string} args.repo
 * @param {string} args.tag
 * @param {string} args.body
 * @param {string} args.token
 */
export async function updateGithubReleaseNotes(args) {
  const listed = await githubJson(args, '/releases?per_page=100');
  if (!listed.ok) {
    const detail = await listed.text();
    throw new Error(`List releases failed: ${String(listed.status)} ${detail}`);
  }
  const releases = /** @type {GithubRelease[]} */ (await listed.json());
  const keep = pickReleaseToKeep(releases, args.tag);
  if (!keep) {
    throw new Error(`No GitHub release for ${args.tag}`);
  }
  for (const id of duplicateReleaseIds(releases, args.tag)) {
    const deleted = await githubJson(args, `/releases/${String(id)}`, {
      method: 'DELETE',
    });
    if (!deleted.ok && deleted.status !== 404) {
      const detail = await deleted.text();
      throw new Error(
        `DELETE duplicate release ${String(id)} failed: ${String(deleted.status)} ${detail}`,
      );
    }
  }
  const patched = await githubJson(args, `/releases/${String(keep.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ body: args.body }),
  });
  if (!patched.ok) {
    const detail = await patched.text();
    throw new Error(
      `PATCH release notes ${args.tag} failed: ${String(patched.status)} ${detail}`,
    );
  }
  return /** @type {GithubRelease} */ (await patched.json());
}

function parseArgs(argv) {
  const out = {
    command: '',
    tag: '',
    title: '',
    target: '',
    notesFile: '',
    draft: false,
  };
  out.command = argv[0] ?? '';
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === '--tag' && next) {
      out.tag = next;
      i += 1;
    } else if (arg === '--title' && next) {
      out.title = next;
      i += 1;
    } else if (arg === '--target' && next) {
      out.target = next;
      i += 1;
    } else if (arg === '--notes-file' && next) {
      out.notesFile = next;
      i += 1;
    } else if (arg === '--draft') {
      out.draft = true;
    }
  }
  return out;
}

async function main(argv) {
  const args = parseArgs(argv);
  const repo = process.env.GITHUB_REPOSITORY ?? '';
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  if (!repo) {
    throw new Error('Set GITHUB_REPOSITORY (owner/repo).');
  }
  if (!token) {
    throw new Error('Set GH_TOKEN or GITHUB_TOKEN.');
  }
  const shared = { fetchImpl: fetch, repo, token };
  if (args.command === 'ensure') {
    if (!args.tag || !args.title || !args.target) {
      throw new Error('ensure requires --tag --title --target');
    }
    const release = await ensureGithubRelease({
      ...shared,
      tag: args.tag,
      title: args.title,
      target: args.target,
      draft: args.draft,
    });
    console.log(`release ${args.tag} id=${String(release.id)}`);
    return;
  }
  if (args.command === 'notes') {
    if (!args.tag || !args.notesFile) {
      throw new Error('notes requires --tag --notes-file');
    }
    const body = readFileSync(args.notesFile, 'utf8');
    const release = await updateGithubReleaseNotes({
      ...shared,
      tag: args.tag,
      body,
    });
    console.log(`updated notes for ${args.tag} id=${String(release.id)}`);
    return;
  }
  throw new Error('Usage: github-release-notes.mjs ensure|notes [flags]');
}

const invokedAsCli =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (invokedAsCli) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
