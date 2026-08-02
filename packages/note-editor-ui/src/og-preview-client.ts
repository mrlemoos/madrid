import { getClerkAccessToken } from '@nota/data-source/clerk-token-ref';
import { notaServerBaseUrl } from './vite-env.js';

import type { PlatformLinkPreview } from '@nota/link-platform-preview';

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

function notaServerBase(): string {
  const base = notaServerBaseUrl();
  if (!base) {
    throw new Error(
      'Link previews require NEXT_PUBLIC_NOTA_SERVER_API_URL (apps/nota-server) to be set.',
    );
  }
  return base;
}

/**
 * Fetches Open Graph metadata for link previews via **`apps/nota-server`**
 * (`GET /api/og-preview`) with Bearer auth. The SPA does not implement OG fetch;
 * set `NEXT_PUBLIC_NOTA_SERVER_API_URL` in local and hosted environments.
 */
export async function fetchOgPreviewForEditor(
  href: string,
): Promise<OgPreviewJson> {
  const q = `url=${encodeURIComponent(href)}`;
  const base = notaServerBase();

  const token = await getClerkAccessToken();
  if (!token) {
    throw new Error('Unauthorized');
  }

  const res = await fetch(`${base}/api/og-preview?${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

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
