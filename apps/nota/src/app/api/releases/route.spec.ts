import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const grab = vi.fn();
const grabkit = vi.fn(() => grab);
const requireUserId = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('grabkit', () => ({ default: grabkit }));
vi.mock('@/server/route-auth', () => ({ requireUserId }));

const route = await import('./route');

function get(query = '') {
  return {
    url: `https://app.getmadrid.app/api/releases${query}`,
  } as unknown as Request;
}

function release(overrides: Record<string, unknown> = {}) {
  return {
    tag_name: 'v1.2.0',
    name: 'Quieter sync',
    html_url: 'https://github.com/mrlemoos/madrid/releases/tag/v1.2.0',
    body: 'Fixes the sidebar flash.',
    published_at: '2026-03-04T10:00:00.000Z',
    draft: false,
    prerelease: false,
    ...overrides,
  };
}

/** The path grabkit was asked for on the most recent call. */
function requestedPath() {
  return grab.mock.calls.at(-1)?.[0] as string;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireUserId.mockResolvedValue({ userId: 'user-1' });
  grab.mockResolvedValue([[release()], null]);
});

afterEach(() => {
  delete process.env.GITHUB_TOKEN;
  delete process.env.NOTA_GITHUB_REPO;
});

describe('GET /api/releases', () => {
  it('maps the GitHub payload onto the shape the dialog reads', async () => {
    // Arrange|Act
    const response = await route.GET(get());

    // Assert
    await expect(response.json()).resolves.toEqual({
      releases: [
        {
          tagName: 'v1.2.0',
          title: 'Quieter sync',
          url: 'https://github.com/mrlemoos/madrid/releases/tag/v1.2.0',
          notes: 'Fixes the sidebar flash.',
          publishedAt: '2026-03-04T10:00:00.000Z',
          prerelease: false,
        },
      ],
    });
  });

  it('falls back to the tag when a release has no title', async () => {
    // Arrange
    grab.mockResolvedValue([[release({ name: null })], null]);

    // Act
    const { releases } = (await (await route.GET(get())).json()) as {
      releases: { title: string }[];
    };

    // Assert
    expect(releases[0]?.title).toBe('v1.2.0');
  });

  it('hides drafts, which are not published yet', async () => {
    // Arrange
    grab.mockResolvedValue([
      [release({ draft: true }), release({ tag_name: 'v1.1.0' })],
      null,
    ]);

    // Act
    const { releases } = (await (await route.GET(get())).json()) as {
      releases: { tagName: string }[];
    };

    // Assert
    expect(releases.map((r) => r.tagName)).toEqual(['v1.1.0']);
  });

  it('defaults to five releases', async () => {
    // Arrange|Act
    await route.GET(get());

    // Assert
    expect(requestedPath()).toContain('per_page=5');
  });

  it('clamps the requested count to a sane range', async () => {
    // Arrange|Act|Assert
    await route.GET(get('?limit=100'));
    expect(requestedPath()).toContain('per_page=20');
    await route.GET(get('?limit=0'));
    expect(requestedPath()).toContain('per_page=1');
    await route.GET(get('?limit=banana'));
    expect(requestedPath()).toContain('per_page=5');
  });

  it('reads the repo from the environment, with the monorepo as default', async () => {
    // Arrange|Act
    await route.GET(get());

    // Assert
    expect(requestedPath()).toContain('/repos/mrlemoos/madrid/releases');

    // Arrange
    process.env.NOTA_GITHUB_REPO = '  someone/fork  ';

    // Act
    await route.GET(get());

    // Assert
    expect(requestedPath()).toContain('/repos/someone/fork/releases');
  });

  it('sends the token only when one is configured', async () => {
    // Arrange|Act
    await route.GET(get());

    // Assert
    const anonymous = grab.mock.calls.at(-1)?.[1] as {
      headers: Record<string, string>;
    };
    expect(anonymous.headers.Authorization).toBeUndefined();

    // Arrange
    process.env.GITHUB_TOKEN = 'ghp_token';

    // Act
    await route.GET(get());

    // Assert — read per request, not at import, so a rotation takes effect
    const authenticated = grab.mock.calls.at(-1)?.[1] as {
      headers: Record<string, string>;
    };
    expect(authenticated.headers.Authorization).toBe('Bearer ghp_token');
  });

  it('answers 401 with an empty list when signed out', async () => {
    // Arrange
    requireUserId.mockResolvedValue(
      Response.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    // Act
    const response = await route.GET(get());

    // Assert — the dialog reads `releases` on every response
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized',
      releases: [],
    });
    expect(grab).not.toHaveBeenCalled();
  });

  it('answers 502 when GitHub itself failed', async () => {
    // Arrange
    grab.mockResolvedValue([
      undefined,
      { name: 'GrabkitError', statusCode: 503, body: null },
    ]);

    // Act
    const response = await route.GET(get());

    // Assert
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to load releases',
      releases: [],
    });
  });
});
