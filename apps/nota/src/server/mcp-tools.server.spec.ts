import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { McpServer, ServerContext } from '@modelcontextprotocol/server';

const notes = {
  mcpAppendToNote: vi.fn(),
  mcpCreateNote: vi.fn(),
  mcpGetNote: vi.fn(),
  mcpListFolders: vi.fn(),
  mcpListNotes: vi.fn(),
  mcpSearchNotes: vi.fn(),
};
class McpNotFoundError extends Error {}
const getServerNotaProEntitled = vi.fn();
const rateLimitMcpToolCall = vi.fn();
const service = { client: 'service' };

vi.mock('server-only', () => ({}));
vi.mock('./mcp-notes.server', () => ({ ...notes, McpNotFoundError }));
vi.mock('./nota-pro-entitlement', () => ({ getServerNotaProEntitled }));
vi.mock('./supabase-service.server', () => ({
  requireServiceSupabase: () => service,
}));
vi.mock('./user-rate-limit.server', () => ({ rateLimitMcpToolCall }));

const { registerMadridMcpTools } = await import('./mcp-tools.server');

type Registered = {
  config: {
    inputSchema: {
      '~standard': {
        validate: (v: unknown) => unknown;
        jsonSchema: { input: () => Record<string, unknown> };
      };
    };
    annotations: { readOnlyHint: boolean };
  };
  cb: (
    args: unknown,
    ctx: ServerContext,
  ) => Promise<{
    isError?: boolean;
    content: Array<{ text: string }>;
  }>;
};

function tool(tools: Map<string, Registered>, name: string): Registered {
  const found = tools.get(name);
  if (!found) throw new Error(`tool ${name} not registered`);
  return found;
}

function registerAll(): Map<string, Registered> {
  const tools = new Map<string, Registered>();
  const server = {
    registerTool: (name: string, config: unknown, cb: unknown) => {
      tools.set(name, { config, cb } as Registered);
    },
  } as unknown as McpServer;
  registerMadridMcpTools(server);
  return tools;
}

function ctxFor(userId?: string): ServerContext {
  return {
    http: userId
      ? {
          authInfo: {
            token: 't',
            clientId: 'client_1',
            scopes: [],
            extra: { userId },
          },
        }
      : {},
  } as unknown as ServerContext;
}

const tools = registerAll();
const call = (name: string, args: unknown, userId: string | null = 'user_1') =>
  tool(tools, name).cb(args, ctxFor(userId ?? undefined));

beforeEach(() => {
  vi.clearAllMocks();
  getServerNotaProEntitled.mockResolvedValue(true);
  rateLimitMcpToolCall.mockReturnValue(true);
});

describe('registerMadridMcpTools', () => {
  it('exposes the v1 tool surface with read/write hints', () => {
    // Arrange|Act
    const summary = [...tools].map(([name, t]) => [
      name,
      t.config.annotations.readOnlyHint,
    ]);

    // Assert
    expect(summary).toEqual([
      ['search_notes', true],
      ['list_notes', true],
      ['list_folders', true],
      ['get_note', true],
      ['create_note', false],
      ['append_to_note', false],
    ]);
  });

  it('publishes JSON Schema and validates input for every tool', async () => {
    // Arrange
    const schema = tool(tools, 'list_notes').config.inputSchema['~standard'];

    // Act
    const json = schema.jsonSchema.input();
    const valid = await schema.validate({});
    const invalid = await schema.validate({ limit: 500 });

    // Assert
    expect(json).toMatchObject({
      type: 'object',
      properties: { limit: { type: 'integer', maximum: 100 } },
    });
    expect(valid).toEqual({ value: { limit: 25, offset: 0 } });
    expect(invalid).toHaveProperty('issues');
  });

  it('runs a read tool for the token’s user and returns JSON text', async () => {
    // Arrange
    notes.mcpListFolders.mockResolvedValue([{ id: 'f1', name: 'Work' }]);

    // Act
    const result = await call('list_folders', {});

    // Assert
    expect(notes.mcpListFolders).toHaveBeenCalledWith(service, 'user_1');
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual([
      { id: 'f1', name: 'Work' },
    ]);
  });

  it('stamps appends with the OAuth client as actor', async () => {
    // Arrange
    notes.mcpAppendToNote.mockResolvedValue({ id: 'n1', appendedBlocks: 1 });

    // Act
    await call('append_to_note', { id: 'n1', markdown: 'hi' });

    // Assert
    expect(notes.mcpAppendToNote).toHaveBeenCalledWith(service, 'user_1', {
      noteId: 'n1',
      markdown: 'hi',
      actor: 'mcp:client_1',
    });
  });

  it('refuses calls without an authenticated user', async () => {
    // Arrange|Act
    const result = await call('list_folders', {}, null);

    // Assert
    expect(result.isError).toBe(true);
    expect(notes.mcpListFolders).not.toHaveBeenCalled();
  });

  it('refuses users without an active subscription', async () => {
    // Arrange
    getServerNotaProEntitled.mockResolvedValue(false);

    // Act
    const result = await call('get_note', { id: 'n1' });

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/subscri/i);
    expect(notes.mcpGetNote).not.toHaveBeenCalled();
  });

  it('rate limits before touching entitlement or data', async () => {
    // Arrange
    rateLimitMcpToolCall.mockReturnValue(false);

    // Act
    const result = await call('list_notes', { limit: 25, offset: 0 });

    // Assert
    expect(result.isError).toBe(true);
    expect(getServerNotaProEntitled).not.toHaveBeenCalled();
    expect(notes.mcpListNotes).not.toHaveBeenCalled();
  });

  it('reports not-found as a tool error the agent can relay', async () => {
    // Arrange
    notes.mcpGetNote.mockRejectedValue(new McpNotFoundError('Note not found'));

    // Act
    const result = await call('get_note', { id: 'n1' });

    // Assert
    expect(result).toMatchObject({
      isError: true,
      content: [{ text: 'Note not found' }],
    });
  });

  it('hides internal error details', async () => {
    // Arrange
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    notes.mcpSearchNotes.mockRejectedValue(new Error('db password wrong'));

    // Act
    const result = await call('search_notes', { query: 'x', limit: 5 });

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).not.toContain('password');
  });
});
