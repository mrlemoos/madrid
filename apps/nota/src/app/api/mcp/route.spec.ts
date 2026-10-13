import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyMcpToken = vi.fn();
const mcpGetNote = vi.fn();
const getServerNotaProEntitled = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@/server/mcp-auth.server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/mcp-auth.server')>()),
  verifyMcpToken,
}));
vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn() }));
vi.mock('@/server/mcp-notes.server', () => ({
  McpNotFoundError: class extends Error {},
  mcpGetNote,
}));
vi.mock('@/server/nota-pro-entitlement', () => ({ getServerNotaProEntitled }));
vi.mock('@/server/supabase-service.server', () => ({
  requireServiceSupabase: () => ({ client: 'service' }),
}));

const route = await import('./route');

function rpc(method: string, params: unknown, token?: string): Request {
  return new Request('https://app.getmadrid.app/api/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-06-18',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
}

/** Streamable HTTP answers as one SSE `message` event. */
async function result(response: Response): Promise<Record<string, unknown>> {
  const data = (await response.text())
    .split('\n')
    .find((line) => line.startsWith('data: '));
  if (!data) throw new Error('no SSE message in response');
  return (
    JSON.parse(data.slice('data: '.length)) as {
      result: Record<string, unknown>;
    }
  ).result;
}

beforeEach(() => {
  vi.clearAllMocks();
  verifyMcpToken.mockImplementation(async (_req: Request, token?: string) =>
    token === 'good'
      ? { token, clientId: 'client_1', scopes: [], extra: { userId: 'user_1' } }
      : undefined,
  );
  getServerNotaProEntitled.mockResolvedValue(true);
});

describe('/api/mcp', () => {
  it('challenges unauthenticated clients toward the OAuth metadata', async () => {
    // Arrange|Act
    const response = await route.POST(rpc('tools/list', {}));

    // Assert
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain(
      'resource_metadata="https://app.getmadrid.app/.well-known/oauth-protected-resource"',
    );
  });

  it('rejects an invalid token', async () => {
    // Arrange|Act
    const response = await route.POST(rpc('tools/list', {}, 'bad'));

    // Assert
    expect(response.status).toBe(401);
  });

  it('lists the Madrid tools for an authenticated client', async () => {
    // Arrange|Act
    const response = await route.POST(rpc('tools/list', {}, 'good'));

    // Assert
    expect(response.status).toBe(200);
    const { tools } = (await result(response)) as { tools: { name: string }[] };
    expect(tools.map((t) => t.name)).toEqual([
      'search_notes',
      'list_notes',
      'list_folders',
      'get_note',
      'create_note',
      'append_to_note',
    ]);
  });

  it('runs a tool as the token’s user', async () => {
    // Arrange
    const id = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
    mcpGetNote.mockResolvedValue({ id, title: 'Plan', markdown: '# Plan' });

    // Act
    const response = await route.POST(
      rpc('tools/call', { name: 'get_note', arguments: { id } }, 'good'),
    );

    // Assert
    const body = (await result(response)) as {
      content: { text: string }[];
      isError?: boolean;
    };
    expect(body.isError).toBeFalsy();
    expect(JSON.parse(body.content[0].text)).toMatchObject({ title: 'Plan' });
    expect(mcpGetNote).toHaveBeenCalledWith(
      { client: 'service' },
      'user_1',
      id,
    );
  });

  it('rejects malformed tool input before any data access', async () => {
    // Arrange|Act
    const response = await route.POST(
      rpc(
        'tools/call',
        { name: 'get_note', arguments: { id: 'nope' } },
        'good',
      ),
    );

    // Assert
    const body = (await result(response)) as { isError?: boolean };
    expect(body.isError).toBe(true);
    expect(mcpGetNote).not.toHaveBeenCalled();
  });
});
