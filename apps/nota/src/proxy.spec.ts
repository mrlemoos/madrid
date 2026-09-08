import { beforeEach, describe, expect, it, vi } from 'vitest';

const next = vi.fn(() => ({ kind: 'next' }));
const redirect = vi.fn((url: URL) => ({ kind: 'redirect', url }));
/** Captures the handler `clerkMiddleware` was given so it can be driven directly. */
const clerkMiddleware = vi.fn(
  (
    handler: (
      auth: () => Promise<{ userId: string | null }>,
      req: unknown,
    ) => unknown,
  ) => handler,
);

vi.mock('next/server', () => ({ NextResponse: { next, redirect } }));
vi.mock('@clerk/nextjs/server', () => ({ clerkMiddleware }));

const proxy = await import('./proxy');

function request(pathname: string) {
  return {
    nextUrl: { pathname },
    url: `https://app.getmadrid.app${pathname}`,
  };
}

function auth(userId: string | null) {
  return () => Promise.resolve({ userId });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('proxy middleware', () => {
  it('sends a signed-in visitor from the landing page straight to their vault', async () => {
    // Arrange|Act
    const result = (await (
      proxy.default as unknown as (
        a: unknown,
        r: unknown,
      ) => Promise<{ kind: string; url: URL }>
    )(auth('user-1'), request('/'))) as { kind: string; url: URL };

    // Assert — a client-side redirect would flash the marketing page first
    expect(result.kind).toBe('redirect');
    expect(result.url.pathname).toBe('/notes');
  });

  it('leaves the landing page alone for a signed-out visitor', async () => {
    // Arrange|Act
    await (
      proxy.default as unknown as (a: unknown, r: unknown) => Promise<unknown>
    )(auth(null), request('/'));

    // Assert
    expect(next).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('does not check the session on any other route', async () => {
    // Arrange
    const check = vi.fn(auth('user-1'));

    // Act
    await (
      proxy.default as unknown as (a: unknown, r: unknown) => Promise<unknown>
    )(check, request('/notes/settings'));

    // Assert — route protection is resource-based, not path-matched here
    expect(check).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});

describe('proxy config', () => {
  it('runs on pages and the API, but not on Next internals or static files', () => {
    // Arrange|Act
    const matcher = proxy.config.matcher;

    // Assert
    expect(matcher).toEqual(['/((?!_next|.*\\..*).*)', '/api/(.*)']);
    const pages = new RegExp(`^${matcher[0] ?? ''}$`);
    expect(pages.test('/notes')).toBe(true);
    expect(pages.test('/_next/static/chunk.js')).toBe(false);
    expect(pages.test('/favicon.svg')).toBe(false);
  });
});
