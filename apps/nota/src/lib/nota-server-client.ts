/*
 * App API client. All endpoints are now served same-origin by the Next App
 * Router (`src/app/api/*`, absorbed from the former nota-server). Authenticated
 * routes use the Clerk session cookie via `clerkMiddleware` (see `proxy.ts`), so
 * no Bearer token is attached here.
 */

/** `GET /api/nota-pro-entitled` — Clerk cookie auth. 401 when signed out. */
export async function fetchNotaProEntitled(): Promise<Response> {
  return fetch('/api/nota-pro-entitled');
}

/** `POST /api/nota-pro-invalidate` — drop the caller's cached entitlement. */
export async function postNotaProInvalidate(): Promise<Response> {
  return fetch('/api/nota-pro-invalidate', { method: 'POST' });
}

/** `POST /api/semantic-search` — entitled semantic vault search. */
export async function postSemanticSearch(body: {
  query: string;
}): Promise<Response> {
  return fetch('/api/semantic-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** `POST /api/search/index-note` — upsert one note's semantic index row. */
export async function postSearchIndexNote(body: {
  noteId: string;
}): Promise<Response> {
  return fetch('/api/search/index-note', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** `POST /api/search/reindex-all` — rebuild the whole semantic index. */
export async function postSearchReindexAll(): Promise<Response> {
  return fetch('/api/search/reindex-all', { method: 'POST' });
}

/** `GET /api/releases` — recent GitHub release notes. */
export async function fetchReleases(limit = 5): Promise<Response> {
  return fetch(`/api/releases?limit=${limit}`);
}
