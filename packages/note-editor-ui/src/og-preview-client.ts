import type { PlatformLinkPreview } from '@getmadrid/link-platform-preview';
import { appApiGrab } from '@getmadrid/data-source/app-api-grab';
import { grabErrorBody } from '@getmadrid/data-source/grab-error';

export type OgPreviewJson = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  platform: PlatformLinkPreview | null;
};

type OgErrorJson = {
  error: string;
};

/**
 * How long a resolved preview stays reusable. Long enough that re-mounting a
 * node view (revisiting a note, an editor re-render, a second `linkPreview`
 * node on the same href) reuses it instead of unfurling the page again; short
 * enough that a session still picks up metadata that changed.
 */
const OG_PREVIEW_TTL_MS = 10 * 60_000;

type OgPreviewCacheEntry = {
  promise: Promise<OgPreviewJson>;
  /** `null` while the request is still on the wire. */
  settledAtMs: number | null;
};

const cacheByHref = new Map<string, OgPreviewCacheEntry>();

function isStillUsable(entry: OgPreviewCacheEntry, now: number): boolean {
  if (entry.settledAtMs === null) return true;
  return now < entry.settledAtMs + OG_PREVIEW_TTL_MS;
}

async function requestOgPreview(href: string): Promise<OgPreviewJson> {
  const q = `url=${encodeURIComponent(href)}`;
  const [data, error] = await appApiGrab()<OgPreviewJson | OgErrorJson>(
    `GET /api/og-preview?${q}`,
  );

  if (error) {
    // The route answers `{ error }` on 400; grabkit parks that body on the error.
    const body = grabErrorBody(error);
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? (body as OgErrorJson).error
        : 'Request failed';
    throw new Error(message);
  }
  if ('error' in data) {
    throw new Error(data.error);
  }
  return data;
}

/**
 * Fetches Open Graph metadata for link previews via the same-origin Next route
 * `GET /api/og-preview` (Clerk session cookie auth). Entitled users only.
 *
 * De-duplicated per href: a second call for an href already on the wire joins
 * the first, and a resolved unfurl is reused for `OG_PREVIEW_TTL_MS`. Failures
 * are never cached, so the node view can surface the error and retry.
 *
 * `force` (the preview card's Refresh button) bypasses a settled entry, but
 * still joins a request already in flight.
 */
export function fetchOgPreviewForEditor(
  href: string,
  options?: { force?: boolean },
): Promise<OgPreviewJson> {
  const cached = cacheByHref.get(href);
  if (cached) {
    const inFlight = cached.settledAtMs === null;
    if (inFlight || (!options?.force && isStillUsable(cached, Date.now()))) {
      return cached.promise;
    }
  }

  const entry: OgPreviewCacheEntry = {
    settledAtMs: null,
    promise: requestOgPreview(href),
  };
  entry.promise = entry.promise.then(
    (data) => {
      entry.settledAtMs = Date.now();
      return data;
    },
    (cause: unknown) => {
      if (cacheByHref.get(href) === entry) cacheByHref.delete(href);
      throw cause;
    },
  );
  cacheByHref.set(href, entry);
  return entry.promise;
}

export function clearOgPreviewCache(): void {
  cacheByHref.clear();
}
