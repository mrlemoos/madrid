import { session, type Session } from 'electron';
import { DEV_PORT, normalisedPackagedAppOrigin } from './app-load-url.js';

/** Origins the Electron shell loads (hosted SPA or local Vite). */
export const NOTA_SHELL_APP_ORIGINS = new Set<string>([
  normalisedPackagedAppOrigin(),
  `http://localhost:${String(DEV_PORT)}`,
  'http://127.0.0.1:4378',
]);

export function isClerkFapiHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h.endsWith('.clerk.accounts.dev') ||
    h.endsWith('.clerk.accounts.com') ||
    h === 'clerk.com' ||
    h.endsWith('.clerk.com') ||
    h === 'clerk.getmadrid.app'
  );
}

export function isClerkFapiRequestUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && isClerkFapiHostname(u.hostname);
  } catch {
    return false;
  }
}

export function shouldPatchClerkFapiCors(
  requestUrl: string,
  requestOrigin: string | undefined,
): boolean {
  if (!requestOrigin || !NOTA_SHELL_APP_ORIGINS.has(requestOrigin)) {
    return false;
  }
  return isClerkFapiRequestUrl(requestUrl);
}

export function readRequestOriginHeader(
  requestHeaders: Record<string, string | string[]> | undefined,
): string | undefined {
  if (!requestHeaders) {
    return undefined;
  }
  for (const [key, value] of Object.entries(requestHeaders)) {
    if (key.toLowerCase() !== 'origin') {
      continue;
    }
    const candidate = Array.isArray(value) ? value[0] : value;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }
  return undefined;
}

function normaliseResponseHeaders(
  responseHeaders: Record<string, string | string[] | undefined>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(responseHeaders)) {
    if (value === undefined) {
      continue;
    }
    out[key] = Array.isArray(value) ? value : [value];
  }
  return out;
}

/**
 * Clerk's custom Frontend API domain can omit CORS headers in Electron even when the
 * shell loads the same hosted origin as the browser. Echo the shell Origin so session
 * token refresh (`/v1/client/sessions/.../tokens`) succeeds.
 */
export function patchClerkFapiCorsResponseHeaders(
  responseHeaders: Record<string, string | string[] | undefined>,
  requestOrigin: string | undefined,
  allowedAppOrigins: ReadonlySet<string> = NOTA_SHELL_APP_ORIGINS,
): Record<string, string[]> | undefined {
  if (!requestOrigin || !allowedAppOrigins.has(requestOrigin)) {
    return undefined;
  }
  const patched = normaliseResponseHeaders(responseHeaders);
  patched['access-control-allow-origin'] = [requestOrigin];
  patched['access-control-allow-credentials'] = ['true'];
  return patched;
}

const CLERK_FAPI_WEB_REQUEST_FILTER = {
  urls: [
    'https://clerk.getmadrid.app/*',
    'https://*.clerk.accounts.dev/*',
    'https://*.clerk.accounts.com/*',
    'https://*.clerk.com/*',
  ],
};

function shellOriginFromReferrer(
  referrer: string | undefined,
): string | undefined {
  if (!referrer) {
    return undefined;
  }
  try {
    const origin = new URL(referrer).origin;
    return NOTA_SHELL_APP_ORIGINS.has(origin) ? origin : undefined;
  } catch {
    return undefined;
  }
}

export function installClerkFapiCorsPatch(
  targetSession: Session = session.defaultSession,
): void {
  const originByRequestId = new Map<number, string>();

  targetSession.webRequest.onBeforeSendHeaders(
    CLERK_FAPI_WEB_REQUEST_FILTER,
    (details, callback) => {
      const origin = readRequestOriginHeader(details.requestHeaders);
      if (origin && NOTA_SHELL_APP_ORIGINS.has(origin)) {
        originByRequestId.set(details.id, origin);
      }
      callback({ requestHeaders: details.requestHeaders });
    },
  );

  targetSession.webRequest.onHeadersReceived(
    CLERK_FAPI_WEB_REQUEST_FILTER,
    (details, callback) => {
      const origin =
        originByRequestId.get(details.id) ??
        shellOriginFromReferrer(details.referrer);
      if (!shouldPatchClerkFapiCors(details.url, origin)) {
        callback({ responseHeaders: details.responseHeaders });
        return;
      }
      const patched = patchClerkFapiCorsResponseHeaders(
        details.responseHeaders ?? {},
        origin,
      );
      callback({
        responseHeaders: patched ?? details.responseHeaders,
      });
    },
  );

  targetSession.webRequest.onCompleted(
    CLERK_FAPI_WEB_REQUEST_FILTER,
    (details) => {
      originByRequestId.delete(details.id);
    },
  );
}
