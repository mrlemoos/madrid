/* App binding re-exports server client with Clerk token; tests use `vi.mock` + dynamic `import()`. */
/* eslint-disable @nx/enforce-module-boundaries -- intentional static wrapper over `@nota/nota-server-client` */
import {
  fetchReleases as fetchReleasesRequest,
  fetchNotaProEntitled as fetchNotaProEntitledRequest,
  postNotaProInvalidate as postNotaProInvalidateRequest,
  postSearchIndexNote as postSearchIndexNoteRequest,
  postSemanticSearch as postSemanticSearchRequest,
  postSearchReindexAll as postSearchReindexAllRequest,
} from '@nota/nota-server-client';
import { getClerkAccessToken } from '@nota/data-source/clerk-token-ref';
import { notaServerBaseUrl } from './vite-env';

/** `GET` on nota-server; Bearer Clerk session JWT. Missing `NEXT_PUBLIC_NOTA_SERVER_API_URL` → 401 without calling the network. */
export async function fetchNotaProEntitled(): Promise<Response> {
  return fetchNotaProEntitledRequest(
    notaServerBaseUrl(),
    await getClerkAccessToken(),
  );
}

/** `POST` on nota-server; same Bearer auth as `fetchNotaProEntitled`. */
export async function postNotaProInvalidate(): Promise<Response> {
  return postNotaProInvalidateRequest(
    notaServerBaseUrl(),
    await getClerkAccessToken(),
  );
}

/** Semantic search (`POST /api/semantic-search`). Requires Nota Pro and `NEXT_PUBLIC_NOTA_SERVER_API_URL`. */
export async function postSemanticSearch(body: {
  query: string;
}): Promise<Response> {
  return postSemanticSearchRequest(
    notaServerBaseUrl(),
    await getClerkAccessToken(),
    body,
  );
}

/** Upsert semantic index row for one note (`POST /api/search/index-note`). */
export async function postSearchIndexNote(body: {
  noteId: string;
}): Promise<Response> {
  return postSearchIndexNoteRequest(
    notaServerBaseUrl(),
    await getClerkAccessToken(),
    body,
  );
}

/** Full vault semantic reindex (`POST /api/search/reindex-all`). */
export async function postSearchReindexAll(): Promise<Response> {
  return postSearchReindexAllRequest(
    notaServerBaseUrl(),
    await getClerkAccessToken(),
  );
}

/** Recent release notes (`GET /api/releases`). */
export async function fetchReleases(limit = 5): Promise<Response> {
  return fetchReleasesRequest(
    notaServerBaseUrl(),
    await getClerkAccessToken(),
    limit,
  );
}
