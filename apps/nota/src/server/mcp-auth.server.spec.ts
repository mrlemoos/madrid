import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@clerk/nextjs/server', () => ({ auth }));

const { clerkFrontendApiUrl, mcpUserId, verifyMcpToken } = await import(
  './mcp-auth.server'
);

const request = new Request('https://app.getmadrid.app/api/mcp');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('clerkFrontendApiUrl', () => {
  it('decodes the Frontend API host from a publishable key', () => {
    // Arrange
    const key = `pk_live_${Buffer.from('clerk.getmadrid.app$').toString('base64')}`;

    // Act|Assert
    expect(clerkFrontendApiUrl(key)).toBe('https://clerk.getmadrid.app');
  });

  it('fails loudly without a key', () => {
    // Arrange|Act|Assert
    expect(() => clerkFrontendApiUrl('')).toThrow(/PUBLISHABLE_KEY/);
  });
});

describe('verifyMcpToken', () => {
  it('maps a valid Clerk OAuth token to AuthInfo with the user id', async () => {
    // Arrange
    auth.mockResolvedValue({
      isAuthenticated: true,
      userId: 'user_1',
      clientId: 'client_1',
      scopes: ['profile'],
    });

    // Act
    const info = await verifyMcpToken(request, 'tok');

    // Assert
    expect(auth).toHaveBeenCalledWith({ acceptsToken: 'oauth_token' });
    expect(info).toEqual({
      token: 'tok',
      clientId: 'client_1',
      scopes: ['profile'],
      extra: { userId: 'user_1' },
    });
    expect(mcpUserId(info)).toBe('user_1');
  });

  it('rejects an invalid token', async () => {
    // Arrange
    auth.mockResolvedValue({ isAuthenticated: false, userId: null });

    // Act|Assert
    await expect(verifyMcpToken(request, 'bad')).resolves.toBeUndefined();
  });

  it('skips Clerk entirely when no bearer token was sent', async () => {
    // Arrange|Act
    const info = await verifyMcpToken(request, undefined);

    // Assert
    expect(info).toBeUndefined();
    expect(auth).not.toHaveBeenCalled();
  });
});

describe('mcpUserId', () => {
  it('returns nothing for missing auth', () => {
    // Arrange|Act|Assert
    expect(mcpUserId(undefined)).toBeUndefined();
  });
});
