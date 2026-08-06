import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NextConfig } from 'next';

function directiveTokens(csp: string, directive: string): string[] {
  const parts = csp.split(';').map((s) => s.trim());
  const prefix = `${directive} `;
  const part = parts.find((p) => p.startsWith(prefix));
  if (!part) {
    return [];
  }
  return part.slice(prefix.length).split(/\s+/).filter(Boolean);
}

/**
 * `next.config.ts` reads `NODE_ENV` at module scope, so each case re-imports the
 * module under the environment it wants to assert on.
 */
async function loadContentSecurityPolicy(
  nodeEnv: string,
): Promise<string | undefined> {
  vi.stubEnv('NODE_ENV', nodeEnv);
  vi.resetModules();
  const { default: nextConfig } = (await import('../next.config')) as {
    default: NextConfig;
  };
  const headerGroups = (await nextConfig.headers?.()) ?? [];
  return headerGroups[0]?.headers.find(
    (h) => h.key === 'Content-Security-Policy',
  )?.value;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('nota next.config.ts CSP', () => {
  it('includes script-src token for Clerk custom Frontend API (*.nota.mrlemoos.dev)', async () => {
    // Arrange + Act
    const csp = await loadContentSecurityPolicy('production');
    const scriptTokens = csp ? directiveTokens(csp, 'script-src') : [];
    const workerTokens = csp ? directiveTokens(csp, 'worker-src') : [];

    // Assert
    expect(csp).toBeDefined();
    expect(scriptTokens).toContain('https://*.nota.mrlemoos.dev');
    expect(scriptTokens).toContain('https://clerk.nota.mrlemoos.dev');
    expect(scriptTokens).toContain('https://*.i.posthog.com');
    expect(workerTokens).toContain("'self'");
    expect(workerTokens).toContain('blob:');
  });

  it('keeps production eval-free and upgrades insecure requests', async () => {
    // Arrange + Act
    const csp = await loadContentSecurityPolicy('production');

    // Assert
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain(' ws:');
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('relaxes eval and ws in development so Turbopack HMR works', async () => {
    // Arrange + Act
    const csp = await loadContentSecurityPolicy('development');
    const scriptTokens = csp ? directiveTokens(csp, 'script-src') : [];
    const connectTokens = csp ? directiveTokens(csp, 'connect-src') : [];

    // Assert
    expect(scriptTokens).toContain("'unsafe-eval'");
    expect(connectTokens).toContain('ws:');
    expect(csp).not.toContain('upgrade-insecure-requests');
  });
});
