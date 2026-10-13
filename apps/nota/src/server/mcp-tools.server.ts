import 'server-only';
import type {
  CallToolResult,
  McpServer,
  ServerContext,
  StandardSchemaWithJSON,
} from '@modelcontextprotocol/server';
import { z } from 'zod/v4';

import { mcpUserId } from './mcp-auth.server';
import {
  McpNotFoundError,
  mcpAppendToNote,
  mcpCreateNote,
  mcpGetNote,
  mcpListFolders,
  mcpListNotes,
  mcpSearchNotes,
} from './mcp-notes.server';
import { getServerNotaProEntitled } from './nota-pro-entitlement';
import { requireServiceSupabase } from './supabase-service.server';
import { rateLimitMcpToolCall } from './user-rate-limit.server';

/**
 * The MCP SDK wants Standard JSON Schema (zod >= 4.2); the catalog is on zod 3,
 * whose `zod/v4` subpath validates but lacks `~standard.jsonSchema`. Bolt it on.
 * ponytail: drop this once the catalog moves to zod >= 4.2.
 */
function toolInput<T extends z.ZodType>(
  schema: T,
): StandardSchemaWithJSON<z.input<T>, z.output<T>> {
  const input = z.toJSONSchema(schema, { io: 'input' });
  const output = z.toJSONSchema(schema, { io: 'output' });
  return {
    '~standard': {
      ...schema['~standard'],
      jsonSchema: { input: () => input, output: () => output },
    },
  };
}

function text(value: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text:
          typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function toolError(message: string): CallToolResult {
  return { ...text(message), isError: true };
}

/**
 * Auth/entitlement/rate-limit gate shared by every tool. Errors come back as
 * tool results (not HTTP errors) so the agent can tell the user what to do.
 */
function gated<A>(
  run: (args: A, userId: string, clientId: string) => Promise<unknown>,
): (args: A, ctx: ServerContext) => Promise<CallToolResult> {
  return async (args, ctx) => {
    const authInfo = ctx.http?.authInfo;
    const userId = mcpUserId(authInfo);
    if (!authInfo || !userId) return toolError('Not signed in to Madrid.');
    if (!rateLimitMcpToolCall(userId)) {
      return toolError('Too many requests. Try again in a minute.');
    }
    if (!(await getServerNotaProEntitled(userId))) {
      return toolError(
        'This Madrid account has no active subscription. Subscribe in Madrid → Settings, then retry.',
      );
    }
    try {
      return text(await run(args, userId, authInfo.clientId));
    } catch (e) {
      if (e instanceof McpNotFoundError) return toolError(e.message);
      console.error('[mcp]', e);
      return toolError('Madrid could not complete that request.');
    }
  };
}

const noteId = z.uuid().describe('Note id from list_notes or search_notes');

export function registerMadridMcpTools(server: McpServer): void {
  server.registerTool(
    'search_notes',
    {
      title: 'Search notes',
      description:
        'Search the user’s Madrid notes by meaning. Wrap exact phrases in double quotes to require them. Returns ids, titles and short snippets; use get_note for the full body.',
      inputSchema: toolInput(
        z.object({
          query: z.string().min(1).max(4000),
          limit: z.number().int().min(1).max(20).default(10),
        }),
      ),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    gated(({ query, limit }, userId) =>
      mcpSearchNotes(requireServiceSupabase(), userId, query, limit),
    ),
  );

  server.registerTool(
    'list_notes',
    {
      title: 'List notes',
      description:
        'List the user’s notes, most recently edited first. Optionally filter by folder_id from list_folders. Page with offset.',
      inputSchema: toolInput(
        z.object({
          folder_id: z.uuid().optional(),
          limit: z.number().int().min(1).max(100).default(25),
          offset: z.number().int().min(0).default(0),
        }),
      ),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    gated(({ folder_id, limit, offset }, userId) =>
      mcpListNotes(requireServiceSupabase(), userId, {
        folderId: folder_id,
        limit,
        offset,
      }),
    ),
  );

  server.registerTool(
    'list_folders',
    {
      title: 'List folders',
      description:
        'List the user’s folders (id, name, parent_id). Use an id as folder_id in list_notes or create_note.',
      inputSchema: toolInput(z.object({})),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    gated((_args, userId) => mcpListFolders(requireServiceSupabase(), userId)),
  );

  server.registerTool(
    'get_note',
    {
      title: 'Read note',
      description:
        'Read one note as Markdown. Attachments appear as placeholders like [PDF: file.pdf]. Very long notes are truncated (truncated: true).',
      inputSchema: toolInput(z.object({ id: noteId })),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    gated(({ id }, userId) => mcpGetNote(requireServiceSupabase(), userId, id)),
  );

  server.registerTool(
    'create_note',
    {
      title: 'Create note',
      description:
        'Create a new note from Markdown (headings, lists, - [ ] tasks, code blocks incl. mermaid, tables, links, bold/italic). Returns the new note id.',
      inputSchema: toolInput(
        z.object({
          title: z.string().max(500),
          markdown: z.string().max(100_000),
          folder_id: z.uuid().optional(),
        }),
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    gated(({ title, markdown, folder_id }, userId) =>
      mcpCreateNote(requireServiceSupabase(), userId, {
        title,
        markdown,
        folderId: folder_id,
      }),
    ),
  );

  server.registerTool(
    'append_to_note',
    {
      title: 'Append to note',
      description:
        'Append Markdown to the end of an existing note. Never changes or removes what is already there. Shows up live if the note is open.',
      inputSchema: toolInput(
        z.object({ id: noteId, markdown: z.string().min(1).max(100_000) }),
      ),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    gated(({ id, markdown }, userId, clientId) =>
      mcpAppendToNote(requireServiceSupabase(), userId, {
        noteId: id,
        markdown,
        actor: `mcp:${clientId}`,
      }),
    ),
  );
}
