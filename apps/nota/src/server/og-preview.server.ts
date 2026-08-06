import * as dns from 'node:dns/promises';
import * as net from 'node:net';
import { z } from 'zod';
import {
  buildRedditPostPreview,
  buildRedditSubPreview,
  buildWikipediaArticlePreview,
  buildYoutubeChannelPreview,
  buildYoutubeVideoPreview,
  parseRedditUrl,
  parseWikipediaUrl,
  parseYoutubeUrl,
  redditPostJsonUrl,
  stripYoutubeChannelTitleSuffix,
  wikipediaSummaryApiUrl,
  wikipediaTitleFromSlug,
  type PlatformLinkPreview,
} from '@nota/link-platform-preview';

const urlSchema = z.string().url();

const MAX_BODY_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 8_000;
/** Maximum redirect responses to follow (each hop re-validates URL + resolved IPs). */
const MAX_OG_FETCH_REDIRECTS = 8;

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export type OgPreviewResult = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  platform: PlatformLinkPreview | null;
};

function isBlockedIpv4(hostname: string): boolean {
  const m = hostname.match(IPV4_RE);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  // CGNAT 100.64.0.0/10
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

/**
 * Blocks common private / non-public IPv6 literals (loopback, link-local, ULA).
 */
function isBlockedIpv6(ip: string): boolean {
  const s = ip.split('%')[0].toLowerCase();
  if (s === '::1') return true;
  // IPv4-mapped: ::ffff:127.0.0.1
  const idx = s.lastIndexOf('::ffff:');
  if (idx !== -1) {
    const v4 = s.slice(idx + '::ffff:'.length);
    if (net.isIPv4(v4)) return isBlockedIpv4(v4);
  }
  // fe80::/10 link-local
  if (/^fe[89ab][0-9a-f]{2}:/i.test(s)) return true;
  // fc00::/7 unique local (fc.. and fd..)
  if (/^f[cd][0-9a-f]{2}:/i.test(s)) return true;
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost') return true;
  if (h.endsWith('.local')) return true;

  if (net.isIPv4(h)) {
    return isBlockedIpv4(h);
  }
  if (net.isIPv6(h)) {
    return isBlockedIpv6(h);
  }

  const m = h.match(IPV4_RE);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

/**
 * Validates URL for server-side OG fetch (SSRF-hardening baseline).
 */
export function assertUrlSafeForOgFetch(raw: string): URL {
  const parsed = urlSchema.parse(raw);
  const u = new URL(parsed);

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed');
  }

  if (isBlockedHostname(u.hostname)) {
    throw new Error('This URL is not allowed');
  }

  return u;
}

function isBlockedResolvedAddress(address: string): boolean {
  if (net.isIPv4(address)) return isBlockedIpv4(address);
  if (net.isIPv6(address)) return isBlockedIpv6(address);
  return true;
}

/**
 * Rejects hostnames whose DNS (or literal IP) resolves to private/link-local/metadata-style ranges.
 * Call after {@link assertUrlSafeForOgFetch} passes for the same URL.
 */
export async function assertResolvedAddressesSafeForOgFetch(
  hostname: string,
): Promise<void> {
  const h = hostname.replace(/^\[|\]$/g, '');
  try {
    const results = await dns.lookup(h, { all: true, verbatim: true });
    for (const { address } of results) {
      if (isBlockedResolvedAddress(address)) {
        throw new Error('This URL is not allowed');
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'This URL is not allowed') throw e;
    throw new Error('Could not resolve host');
  }
}

function decodeMetaContent(raw: string): string {
  return raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function matchOgOrMeta(html: string, property: string): string | null {
  const esc = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const propFirst = new RegExp(
    `<meta[^>]*\\bproperty=["']${esc}["'][^>]*\\bcontent=["']([^"']*)["']`,
    'i',
  );
  const m1 = html.match(propFirst);
  if (m1?.[1]) return decodeMetaContent(m1[1].trim());

  const contentFirst = new RegExp(
    `<meta[^>]*\\bcontent=["']([^"']*)["'][^>]*\\bproperty=["']${esc}["']`,
    'i',
  );
  const m2 = html.match(contentFirst);
  if (m2?.[1]) return decodeMetaContent(m2[1].trim());

  return null;
}

function matchNameDescription(html: string): string | null {
  const re =
    /<meta[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i;
  const m = html.match(re);
  if (m?.[1]) return decodeMetaContent(m[1].trim());
  const re2 =
    /<meta[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["']/i;
  const m2 = html.match(re2);
  if (m2?.[1]) return decodeMetaContent(m2[1].trim());
  return null;
}

function matchTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]{1,500})<\/title>/i);
  if (m?.[1]) return decodeMetaContent(m[1].trim());
  return null;
}

/** Only http(s) images are returned to clients (defence in depth for `<img src>`). */
export function sanitizeOgImageUrl(
  resolved: string,
  pageUrl: string,
): string | null {
  try {
    const abs = new URL(resolved, pageUrl).href;
    const u = new URL(abs);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return null;
    }
    return abs;
  } catch {
    return null;
  }
}

export function parseOgFromHtml(
  html: string,
  pageUrl: string,
): OgPreviewResult {
  const title = matchOgOrMeta(html, 'og:title') ?? matchTitleTag(html) ?? null;
  const description =
    matchOgOrMeta(html, 'og:description') ?? matchNameDescription(html) ?? null;
  let image = matchOgOrMeta(html, 'og:image');

  if (image) {
    image = sanitizeOgImageUrl(image, pageUrl);
  }

  return {
    url: pageUrl,
    title,
    description,
    image,
    platform: null,
  };
}

type RedditListingChild = {
  data?: {
    children?: { data?: Record<string, unknown> }[];
  };
};

function pickString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function httpsImageFromMeta(
  raw: string | undefined,
  pageUrl: string,
): string | undefined {
  if (!raw?.trim()) return undefined;
  return sanitizeOgImageUrl(raw.trim(), pageUrl) ?? undefined;
}

function parseRedditPostJson(
  payload: unknown,
  pageUrl: string,
): {
  author: string;
  title: string;
  subreddit: string;
  subredditAvatarUrl?: string;
  userAvatarUrl?: string;
} | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const listing = payload[0] as RedditListingChild;
  const post = listing.data?.children?.[0]?.data;
  if (!post) return null;
  const author = pickString(post['author']);
  const title = pickString(post['title']);
  const subreddit = pickString(post['subreddit']) ?? '';
  if (!author || !title) return null;

  const subredditAvatarRaw =
    pickString(post['community_icon']) ??
    pickString(post['subreddit_icon']) ??
    pickString(post['subreddit_img']);
  const userAvatarRaw =
    pickString(post['snoovatar_img']) ?? pickString(post['author_icon']);

  return {
    author,
    title,
    subreddit,
    subredditAvatarUrl: httpsImageFromMeta(subredditAvatarRaw, pageUrl),
    userAvatarUrl: httpsImageFromMeta(userAvatarRaw, pageUrl),
  };
}

async function fetchRedditSubredditIcon(
  subreddit: string,
): Promise<string | undefined> {
  if (!subreddit.trim()) return undefined;
  const aboutUrl = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/about.json?raw_json=1`;
  try {
    const payload = (await fetchJsonForPlatform(aboutUrl)) as {
      data?: { community_icon?: string; icon_img?: string };
    };
    const d = payload.data;
    if (!d) return undefined;
    const raw = d.community_icon ?? d.icon_img;
    return httpsImageFromMeta(raw, aboutUrl);
  } catch {
    return undefined;
  }
}

async function fetchRedditUserIcon(
  username: string,
): Promise<string | undefined> {
  const clean = username.replace(/^u\//i, '').trim();
  if (!clean || clean === '[deleted]') return undefined;
  const aboutUrl = `https://www.reddit.com/user/${encodeURIComponent(clean)}/about.json?raw_json=1`;
  try {
    const payload = (await fetchJsonForPlatform(aboutUrl)) as {
      data?: { snoovatar_img?: string; icon_img?: string };
    };
    const d = payload.data;
    if (!d) return undefined;
    const raw = d.snoovatar_img ?? d.icon_img;
    return httpsImageFromMeta(raw, aboutUrl);
  } catch {
    return undefined;
  }
}

async function fetchJsonForPlatform(url: string): Promise<unknown> {
  const parsed = assertUrlSafeForOgFetch(url);
  await assertResolvedAddressesSafeForOgFetch(parsed.hostname);

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(parsed.href, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent':
          'NotaLinkPreview/1.0 (link preview; contact: https://nota.mrlemoos.dev)',
      },
    });
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRedditPostPlatformPreview(
  subreddit: string,
  postId: string,
): Promise<PlatformLinkPreview | null> {
  const jsonUrl = redditPostJsonUrl(subreddit, postId);
  const payload = await fetchJsonForPlatform(jsonUrl);
  const post = parseRedditPostJson(payload, jsonUrl);
  if (!post) return null;
  const subName = post.subreddit || subreddit || 'reddit';

  const [subFromAbout, userFromAbout] = await Promise.all([
    post.subredditAvatarUrl
      ? Promise.resolve(undefined)
      : fetchRedditSubredditIcon(subName),
    post.userAvatarUrl
      ? Promise.resolve(undefined)
      : fetchRedditUserIcon(post.author),
  ]);

  return buildRedditPostPreview({
    op: post.author,
    postTitle: post.title,
    subreddit: subName,
    subredditAvatarUrl: post.subredditAvatarUrl ?? subFromAbout,
    userAvatarUrl: post.userAvatarUrl ?? userFromAbout,
  });
}

type YoutubeOEmbed = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  author_url?: string;
};

type WikipediaSummary = {
  title?: string;
  extract?: string;
  thumbnail?: { source?: string };
};

async function fetchWikipediaArticlePlatformPreview(
  parsed: NonNullable<ReturnType<typeof parseWikipediaUrl>>,
): Promise<PlatformLinkPreview | null> {
  const apiUrl = wikipediaSummaryApiUrl(parsed.lang, parsed.titleSlug);
  const fallbackTitle = wikipediaTitleFromSlug(parsed.titleSlug);

  try {
    const payload = (await fetchJsonForPlatform(apiUrl)) as WikipediaSummary;
    const articleTitle = payload.title?.trim() || fallbackTitle;
    if (!articleTitle) return null;

    const extract = payload.extract?.trim() || undefined;
    const thumbnailUrl = httpsImageFromMeta(
      payload.thumbnail?.source?.trim(),
      apiUrl,
    );

    return buildWikipediaArticlePreview({
      articleTitle,
      extract,
      thumbnailUrl,
    });
  } catch {
    if (!fallbackTitle) return null;
    return buildWikipediaArticlePreview({ articleTitle: fallbackTitle });
  }
}

async function fetchYoutubeVideoPlatformPreview(
  videoUrl: string,
): Promise<PlatformLinkPreview | null> {
  const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`;
  const payload = (await fetchJsonForPlatform(oembedUrl)) as YoutubeOEmbed;
  const videoTitle = payload.title?.trim();
  const channelName = payload.author_name?.trim();
  if (!videoTitle || !channelName) return null;

  const thumbnailUrl = httpsImageFromMeta(
    payload.thumbnail_url?.trim(),
    oembedUrl,
  );

  let channelAvatarUrl: string | undefined;
  const authorUrl = payload.author_url?.trim();
  if (authorUrl) {
    try {
      const u = assertUrlSafeForOgFetch(authorUrl);
      const og = await fetchOgHtmlPreview(u.href);
      channelAvatarUrl = httpsImageFromMeta(og.image ?? undefined, u.href);
    } catch {
      channelAvatarUrl = undefined;
    }
  }

  return buildYoutubeVideoPreview({
    videoTitle,
    channelName,
    thumbnailUrl,
    channelAvatarUrl,
  });
}

async function tryFetchPlatformLinkPreview(
  rawUrl: string,
): Promise<PlatformLinkPreview | null> {
  const wikipedia = parseWikipediaUrl(rawUrl);
  if (wikipedia?.kind === 'article') {
    try {
      return await fetchWikipediaArticlePlatformPreview(wikipedia);
    } catch {
      return null;
    }
  }

  const reddit = parseRedditUrl(rawUrl);
  if (reddit?.kind === 'subreddit') {
    let subredditAvatarUrl: string | undefined;
    try {
      subredditAvatarUrl = await fetchRedditSubredditIcon(reddit.subreddit);
    } catch {
      subredditAvatarUrl = undefined;
    }
    return buildRedditSubPreview(rawUrl.trim(), {
      subreddit: reddit.subreddit,
      subredditAvatarUrl,
    });
  }
  if (reddit?.kind === 'post') {
    try {
      return await fetchRedditPostPlatformPreview(
        reddit.subreddit,
        reddit.postId,
      );
    } catch {
      return null;
    }
  }

  const youtube = parseYoutubeUrl(rawUrl);
  if (!youtube) return null;

  if (youtube.kind === 'video') {
    try {
      return await fetchYoutubeVideoPlatformPreview(rawUrl);
    } catch {
      return null;
    }
  }

  try {
    const og = await fetchOgHtmlPreview(rawUrl);
    const channelTitle = stripYoutubeChannelTitleSuffix(og.title ?? '');
    if (!channelTitle) return null;
    const img = httpsImageFromMeta(og.image ?? undefined, rawUrl);
    return buildYoutubeChannelPreview(channelTitle, {
      thumbnailUrl: img,
      channelAvatarUrl: img,
    });
  } catch {
    return null;
  }
}

async function readBodyWithCap(
  response: Response,
  maxBytes: number,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return '';
  }

  const decoder = new TextDecoder();
  let total = 0;
  const chunks: Uint8Array[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.length;
    if (total > maxBytes) {
      const keep = value.length - (total - maxBytes);
      if (keep > 0) {
        chunks.push(value.slice(0, keep));
      }
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }

  reader.releaseLock?.();

  let out = '';
  for (const c of chunks) {
    out += decoder.decode(c, { stream: true });
  }
  out += decoder.decode();
  return out;
}

async function drainResponseBody(response: Response): Promise<void> {
  await response.body?.cancel();
}

async function fetchOgHtmlPreview(rawUrl: string): Promise<OgPreviewResult> {
  let current = assertUrlSafeForOgFetch(rawUrl).href;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  const fetchOpts = {
    signal: controller.signal,
    redirect: 'manual' as RequestRedirect,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent':
        'NotaOgPreview/1.0 (+https://nota; link preview for signed-in users)',
    },
  };

  try {
    let redirectsFollowed = 0;

    for (;;) {
      const host = new URL(current).hostname;
      await assertResolvedAddressesSafeForOgFetch(host);

      const response = await fetch(current, fetchOpts);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        await drainResponseBody(response);
        if (!location) {
          throw new Error('Redirect without Location');
        }
        if (redirectsFollowed >= MAX_OG_FETCH_REDIRECTS) {
          throw new Error('Too many redirects');
        }
        const next = new URL(location, response.url);
        assertUrlSafeForOgFetch(next.href);
        current = next.href;
        redirectsFollowed += 1;
        continue;
      }

      if (!response.ok) {
        await drainResponseBody(response);
        throw new Error(`Fetch failed: ${response.status}`);
      }

      const ct = response.headers.get('content-type') ?? '';
      if (!ct.includes('text/html') && !ct.includes('application/xhtml')) {
        await drainResponseBody(response);
        return {
          url: current,
          title: null,
          description: null,
          image: null,
          platform: null,
        };
      }

      const html = await readBodyWithCap(response, MAX_BODY_BYTES);
      return parseOgFromHtml(html, current);
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchOgPreview(rawUrl: string): Promise<OgPreviewResult> {
  const platform = await tryFetchPlatformLinkPreview(rawUrl);
  if (platform) {
    return {
      url: rawUrl,
      title: null,
      description: null,
      image: null,
      platform,
    };
  }

  const og = await fetchOgHtmlPreview(rawUrl);
  return { ...og, platform: null };
}
