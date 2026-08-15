import * as dns from 'node:dns/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertResolvedAddressesSafeForOgFetch,
  assertUrlSafeForOgFetch,
  fetchOgPreview,
  parseOgFromHtml,
  sanitizeOgImageUrl,
} from './og-preview.server';

// ESM namespace exports are frozen, so `vi.spyOn(dns, 'lookup')` cannot redefine
// the binding. Re-exporting through `vi.mock` gives a writable module object.
vi.mock('node:dns/promises', async (importOriginal) => ({
  ...(await importOriginal<typeof dns>()),
}));

describe('parseOgFromHtml', () => {
  it('extracts og tags and resolves relative image', () => {
    // Arrange
    const html = `
      <html><head>
        <meta property="og:title" content="Hello &amp; world" />
        <meta property="og:description" content="Desc" />
        <meta property="og:image" content="/pic.png" />
      </head></html>
    `;
    const pageUrl = 'https://example.com/page';

    // Act
    const r = parseOgFromHtml(html, pageUrl);

    // Assert
    expect(r.title).toBe('Hello & world');
    expect(r.description).toBe('Desc');
    expect(r.image).toBe('https://example.com/pic.png');
  });

  it('falls back to title tag and meta description', () => {
    // Arrange
    const html =
      '<html><head><title>  Plain title  </title>' +
      '<meta name="description" content="From name" /></head></html>';
    const pageUrl = 'https://x.test/';

    // Act
    const r = parseOgFromHtml(html, pageUrl);

    // Assert
    expect(r.title).toBe('Plain title');
    expect(r.description).toBe('From name');
  });

  it('drops og:image when resolved URL is not http(s)', () => {
    // Arrange
    const html = `
      <html><head>
        <meta property="og:image" content="javascript:alert(1)" />
      </head></html>
    `;
    const pageUrl = 'https://example.com/page';

    // Act
    const r = parseOgFromHtml(html, pageUrl);

    // Assert
    expect(r.image).toBeNull();
  });

  it('keeps https og:image absolute URLs', () => {
    // Arrange
    const html = `
      <html><head>
        <meta property="og:image" content="https://cdn.example.com/x.png" />
      </head></html>
    `;
    const pageUrl = 'https://example.com/page';

    // Act
    const r = parseOgFromHtml(html, pageUrl);

    // Assert
    expect(r.image).toBe('https://cdn.example.com/x.png');
    expect(r.platform).toBeNull();
  });
});

describe('tryFetchPlatformLinkPreview via fetchOgPreview', () => {
  let lookupSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    lookupSpy = vi
      .spyOn(dns, 'lookup')
      .mockImplementation(async () => [{ address: '8.8.8.8', family: 4 }]);
  });

  afterEach(() => {
    lookupSpy.mockRestore();
  });

  it('returns reddit sub preview without HTML fetch', async () => {
    // Arrange
    const url = 'https://www.reddit.com/r/programming';
    const orig = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          data: {
            community_icon: 'https://styles.redditmedia.com/t5_2qh0z/icon.png',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );

    try {
      // Act
      const r = await fetchOgPreview(url);

      // Assert
      expect(r.platform).toMatchObject({
        kind: 'reddit-sub',
        displayText: url,
        subreddit: 'programming',
        subredditAvatarUrl: 'https://styles.redditmedia.com/t5_2qh0z/icon.png',
      });
      expect(r.title).toBeNull();
    } finally {
      globalThis.fetch = orig;
    }
  });

  it('returns wikipedia article preview from the REST summary API', async () => {
    // Arrange
    const url = 'https://en.wikipedia.org/wiki/Alan_Turing';
    const orig = globalThis.fetch;
    globalThis.fetch = async (input: string | URL) => {
      const target =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (target.includes('/api/rest_v1/page/summary/Alan_Turing')) {
        return new Response(
          JSON.stringify({
            title: 'Alan Turing',
            extract: 'English mathematician and computer scientist.',
            thumbnail: {
              source:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/320px-Alan_Turing_Aged_16.jpg',
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected fetch: ${target}`);
    };

    try {
      // Act
      const r = await fetchOgPreview(url);

      // Assert
      expect(r.platform).toMatchObject({
        kind: 'wikipedia-article',
        boldText: 'Alan Turing',
        suffixText: ' on Wikipedia',
        extract: 'English mathematician and computer scientist.',
        thumbnailUrl:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/320px-Alan_Turing_Aged_16.jpg',
      });
      expect(r.platform?.logoUrl).toContain('wikipedia.svg');
      expect(r.title).toBeNull();
    } finally {
      globalThis.fetch = orig;
    }
  });
});

describe('sanitizeOgImageUrl', () => {
  it('returns null for javascript: URLs', () => {
    // Arrange
    const raw = 'javascript:alert(1)';
    const base = 'https://a.com/';

    // Act
    const result = sanitizeOgImageUrl(raw, base);

    // Assert
    expect(result).toBeNull();
  });
});

describe('assertUrlSafeForOgFetch', () => {
  it('accepts public https URLs', () => {
    // Arrange
    const url = 'https://example.com/path?q=1';

    // Act
    const u = assertUrlSafeForOgFetch(url);

    // Assert
    expect(u.hostname).toBe('example.com');
  });

  it('rejects localhost', () => {
    // Arrange
    const url = 'http://localhost:3000/';

    // Act
    const act = () => assertUrlSafeForOgFetch(url);

    // Assert
    expect(act).toThrow();
  });
});

describe('assertResolvedAddressesSafeForOgFetch', () => {
  it('rejects loopback IPv4 literals', async () => {
    // Arrange
    const host = '127.0.0.1';

    // Act
    const promise = assertResolvedAddressesSafeForOgFetch(host);

    // Assert
    await expect(promise).rejects.toThrow('This URL is not allowed');
  });

  it('rejects loopback IPv6 literals', async () => {
    // Arrange
    const host = '::1';

    // Act
    const promise = assertResolvedAddressesSafeForOgFetch(host);

    // Assert
    await expect(promise).rejects.toThrow('This URL is not allowed');
  });

  it('rejects when DNS resolves to a private address', async () => {
    // Arrange
    const spy = vi
      .spyOn(dns, 'lookup')
      .mockImplementation(async () => [{ address: '10.0.0.1', family: 4 }]);
    const host = 'example.com';

    try {
      // Act
      const promise = assertResolvedAddressesSafeForOgFetch(host);

      // Assert
      await expect(promise).rejects.toThrow('This URL is not allowed');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('fetchOgPreview', () => {
  let lookupSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    lookupSpy = vi
      .spyOn(dns, 'lookup')
      .mockImplementation(async () => [{ address: '8.8.8.8', family: 4 }]);
  });

  afterEach(() => {
    lookupSpy.mockRestore();
  });

  // `response.url` is '' on a hand-built Response, and Node's URL rejects '' as a
  // base even when the Location is absolute (Bun tolerated it). Stamp the real
  // request URL on so the redirect resolution matches production.
  function redirectTo(location: string, from: string): Response {
    const res = new Response(null, {
      status: 302,
      headers: { Location: location },
    });
    Object.defineProperty(res, 'url', { value: from });
    return res;
  }

  it('does not follow a redirect to a blocked host (SSRF hardening)', async () => {
    // Arrange
    const orig = globalThis.fetch;
    const startUrl = 'https://example.com/start';
    globalThis.fetch = async () =>
      redirectTo('http://127.0.0.1/secret', startUrl);

    try {
      // Act
      const promise = fetchOgPreview(startUrl);

      // Assert
      await expect(promise).rejects.toThrow('This URL is not allowed');
    } finally {
      globalThis.fetch = orig;
    }
  });

  it('stops after max redirects', async () => {
    // Arrange
    const orig = globalThis.fetch;
    const startUrl = 'https://example.com/start';
    let n = 0;
    globalThis.fetch = async () => {
      n += 1;
      return redirectTo(`https://hop${n}.example/next`, startUrl);
    };

    try {
      // Act
      const promise = fetchOgPreview(startUrl);

      // Assert
      await expect(promise).rejects.toThrow('Too many redirects');
    } finally {
      globalThis.fetch = orig;
    }
  });
});
