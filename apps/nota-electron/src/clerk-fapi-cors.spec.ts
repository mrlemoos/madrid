import { describe, expect, it } from 'vitest';
import {
  isClerkFapiHostname,
  NOTA_SHELL_APP_ORIGINS,
  patchClerkFapiCorsResponseHeaders,
  readRequestOriginHeader,
  shouldPatchClerkFapiCors,
} from './clerk-fapi-cors.js';

describe('clerk-fapi-cors', () => {
  it('recognises Clerk Frontend API hostnames', () => {
    // Arrange
    const custom = 'clerk.getmadrid.app';
    const dev = 'notable-foo.clerk.accounts.dev';
    const unrelated = 'app.getmadrid.app';

    // Act
    const customOk = isClerkFapiHostname(custom);
    const devOk = isClerkFapiHostname(dev);
    const appOk = isClerkFapiHostname(unrelated);

    // Assert
    expect(customOk).toBe(true);
    expect(devOk).toBe(true);
    expect(appOk).toBe(false);
  });

  it('shouldPatchClerkFapiCors only for Clerk FAPI URLs from allowed shell origins', () => {
    // Arrange
    const tokenUrl =
      'https://clerk.getmadrid.app/v1/client/sessions/sess_x/tokens';
    const appOrigin = 'https://app.getmadrid.app';
    const foreignOrigin = 'https://evil.example';

    // Act
    const allowed = shouldPatchClerkFapiCors(tokenUrl, appOrigin);
    const foreign = shouldPatchClerkFapiCors(tokenUrl, foreignOrigin);
    const nonClerk = shouldPatchClerkFapiCors(
      'https://app.getmadrid.app/notes',
      appOrigin,
    );

    // Assert
    expect(allowed).toBe(true);
    expect(foreign).toBe(false);
    expect(nonClerk).toBe(false);
    expect(NOTA_SHELL_APP_ORIGINS.has(appOrigin)).toBe(true);
  });

  it('patchClerkFapiCorsResponseHeaders echoes the shell Origin and allows credentials', () => {
    // Arrange
    const origin = 'https://app.getmadrid.app';
    const incoming = {
      'Content-Type': ['application/json'],
    };

    // Act
    const patched = patchClerkFapiCorsResponseHeaders(
      incoming,
      origin,
      NOTA_SHELL_APP_ORIGINS,
    );

    // Assert
    expect(patched).toBeDefined();
    expect(patched?.['access-control-allow-origin']).toEqual([origin]);
    expect(patched?.['access-control-allow-credentials']).toEqual(['true']);
    expect(patched?.['Content-Type']).toEqual(['application/json']);
  });

  it('readRequestOriginHeader is case-insensitive', () => {
    // Arrange
    const headers = { origin: ['http://localhost:4200'] };

    // Act
    const value = readRequestOriginHeader(headers);

    // Assert
    expect(value).toBe('http://localhost:4200');
  });

  it('readRequestOriginHeader ignores an empty Origin key when lowercase origin is set', () => {
    // Arrange
    const headers: Record<string, string | string[]> = {
      Origin: '',
      origin: ['https://app.getmadrid.app'],
    };

    // Act
    const value = readRequestOriginHeader(headers);

    // Assert
    expect(value).toBe('https://app.getmadrid.app');
  });
});
