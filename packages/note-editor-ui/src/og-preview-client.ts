import type { PlatformLinkPreview } from '@getmadrid/link-platform-preview';

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
 * Fetches Open Graph metadata for link previews via the same-origin Next route
 * `GET /api/og-preview` (Clerk session cookie auth). Entitled users only.
 */
export async function fetchOgPreviewForEditor(
  href: string,
): Promise<OgPreviewJson> {
  const q = `url=${encodeURIComponent(href)}`;
  const res = await fetch(`/api/og-preview?${q}`);

  const data = (await res.json()) as OgPreviewJson | OgErrorJson;
  if (!res.ok) {
    const err = 'error' in data ? data.error : 'Request failed';
    throw new Error(err);
  }
  if ('error' in data) {
    throw new Error(data.error);
  }
  return data;
}
