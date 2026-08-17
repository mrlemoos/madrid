import { describe, expect, it, vi } from 'vitest';
import {
  duplicateReleaseIds,
  ensureGithubRelease,
  pickReleaseToKeep,
  updateGithubReleaseNotes,
} from '../../../tools/github-release-notes.mjs';

type GithubRelease = {
  id: number;
  tag_name: string;
  assets: Array<{ name: string }>;
};

function release(id: number, tag: string, assetCount: number): GithubRelease {
  return {
    id,
    tag_name: tag,
    assets: Array.from({ length: assetCount }, (_, i) => ({
      name: `asset-${String(i)}.zip`,
    })),
  };
}

describe('pickReleaseToKeep', () => {
  it('keeps the release with the most assets for the tag', () => {
    // Arrange
    const releases = [
      release(1, 'v0.1.25', 1),
      release(2, 'v0.1.25', 8),
      release(3, 'v0.1.24', 4),
    ];

    // Act
    const kept = pickReleaseToKeep(releases, 'v0.1.25');

    // Assert
    expect(kept?.id).toBe(2);
  });

  it('returns null when no release matches the tag', () => {
    // Arrange
    const releases = [release(1, 'v0.1.24', 2)];

    // Act
    const kept = pickReleaseToKeep(releases, 'v0.1.25');

    // Assert
    expect(kept).toBeNull();
  });
});

describe('duplicateReleaseIds', () => {
  it('returns every matching id except the one with the most assets', () => {
    // Arrange
    const releases = [
      release(371477789, 'v0.1.25', 1),
      release(371477790, 'v0.1.25', 8),
    ];

    // Act
    const ids = duplicateReleaseIds(releases, 'v0.1.25');

    // Assert
    expect(ids).toEqual([371477789]);
  });
});

describe('ensureGithubRelease', () => {
  it('creates the release when GET by tag returns 404', async () => {
    // Arrange
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      if (String(input).includes('/releases/tags/')) {
        return new Response('Not Found', { status: 404 });
      }
      return new Response(JSON.stringify({ id: 99, tag_name: 'v0.1.25' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Act
    const created = await ensureGithubRelease({
      fetchImpl,
      repo: 'mrlemoos/nota',
      tag: 'v0.1.25',
      title: '0.1.25',
      target: 'abc123',
      draft: false,
      token: 'tok',
    });

    // Assert
    expect(created.id).toBe(99);
    const createCall = fetchImpl.mock.calls.find((call) => {
      const init = call[1];
      return init?.method === 'POST';
    });
    expect(createCall).toBeDefined();
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual({
      tag_name: 'v0.1.25',
      name: '0.1.25',
      target_commitish: 'abc123',
      draft: false,
      body: '',
    });
  });

  it('skips create when the tag already has a release', async () => {
    // Arrange
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({ id: 7, tag_name: 'v0.1.25', assets: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    // Act
    const existing = await ensureGithubRelease({
      fetchImpl,
      repo: 'mrlemoos/nota',
      tag: 'v0.1.25',
      title: '0.1.25',
      target: 'abc123',
      draft: false,
      token: 'tok',
    });

    // Assert
    expect(existing.id).toBe(7);
    expect(
      fetchImpl.mock.calls.some((call) => call[1]?.method === 'POST'),
    ).toBe(false);
  });
});

describe('updateGithubReleaseNotes', () => {
  it('deletes duplicate releases then PATCHes body without tag_name', async () => {
    // Arrange
    const deleted: number[] = [];
    let patchedBody: unknown;
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (method === 'GET' && url.endsWith('/releases?per_page=100')) {
        return new Response(
          JSON.stringify([
            release(371477789, 'v0.1.25', 1),
            release(371477790, 'v0.1.25', 8),
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (method === 'DELETE') {
        const id = Number(url.split('/').at(-1));
        deleted.push(id);
        return new Response(null, { status: 204 });
      }
      if (method === 'PATCH') {
        patchedBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ id: 371477790, tag_name: 'v0.1.25' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response('unexpected', { status: 500 });
    });

    // Act
    await updateGithubReleaseNotes({
      fetchImpl,
      repo: 'mrlemoos/nota',
      tag: 'v0.1.25',
      body: '## Notes\n',
      token: 'tok',
    });

    // Assert
    expect(deleted).toEqual([371477789]);
    expect(patchedBody).toEqual({ body: '## Notes\n' });
    expect(patchedBody).not.toHaveProperty('tag_name');
  });
});
