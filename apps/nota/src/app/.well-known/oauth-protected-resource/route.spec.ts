import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));

const route = await import('./route');

describe('/.well-known/oauth-protected-resource', () => {
  it('names Clerk as the authorization server for this origin', async () => {
    // Arrange
    vi.stubEnv(
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      `pk_live_${Buffer.from('clerk.getmadrid.app$').toString('base64')}`,
    );

    // Act
    const response = route.GET(
      new Request(
        'https://app.getmadrid.app/.well-known/oauth-protected-resource',
      ),
    );

    // Assert
    await expect(response.json()).resolves.toEqual({
      resource: 'https://app.getmadrid.app',
      authorization_servers: ['https://clerk.getmadrid.app'],
    });
    vi.unstubAllEnvs();
  });

  it('answers CORS preflight for browser-based MCP clients', () => {
    // Arrange|Act
    const response = route.OPTIONS();

    // Assert
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });
});
