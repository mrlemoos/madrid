import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  createNote,
  type TypedSupabaseClient,
} from '@getmadrid/data-source/models/notes';

import { extractPlainTextFromDocJson } from './note-plain-text.server';
import {
  markdownToNoteBlocks,
  noteDocToMarkdown,
} from './note-markdown.server';
import { appendBlocksToYjsLog } from './note-yjs-append.server';
import {
  semanticSearchNotes,
  upsertSemanticIndexForNote,
} from './semantic-search-ops.server';

// Every vault read/write the MCP server makes. The service key bypasses RLS, so
// EVERY query here is scoped by `user_id = userId` (or an ownership check
// first). Nothing else in the MCP path touches the Supabase client directly.

/** A note or folder id that does not exist for this user (never leaks which). */
export class McpNotFoundError extends Error {}

const MAX_NOTE_MARKDOWN_CHARS = 100_000;
const SNIPPET_CHARS = 200;

export async function mcpListNotes(
  supabase: SupabaseClient,
  userId: string,
  options: { folderId?: string; limit: number; offset: number },
) {
  let query = supabase
    .from('notes')
    .select('id,title,folder_id,updated_at')
    .eq('user_id', userId);
  if (options.folderId) {
    query = query.eq('folder_id', options.folderId);
  }
  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .range(options.offset, options.offset + options.limit - 1);
  if (error) throw new Error(`list notes failed: ${error.message}`);
  return data;
}

export async function mcpListFolders(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('folders')
    .select('id,name,parent_id')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw new Error(`list folders failed: ${error.message}`);
  return data;
}

export async function mcpGetNote(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
) {
  const { data, error } = await supabase
    .from('notes')
    .select('id,title,folder_id,updated_at,content')
    .eq('id', noteId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`get note failed: ${error.message}`);
  if (!data) throw new McpNotFoundError('Note not found');
  const markdown = noteDocToMarkdown(data.content);
  const truncated = markdown.length > MAX_NOTE_MARKDOWN_CHARS;
  return {
    id: data.id as string,
    title: data.title as string,
    folder_id: data.folder_id as string | null,
    updated_at: data.updated_at as string | null,
    markdown: truncated ? markdown.slice(0, MAX_NOTE_MARKDOWN_CHARS) : markdown,
    truncated,
  };
}

export async function mcpSearchNotes(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  limit: number,
) {
  const { results } = await semanticSearchNotes({ supabase, userId, query });
  const ids = results.slice(0, limit).map((r) => r.noteId);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('notes')
    .select('id,title,content')
    .eq('user_id', userId)
    .in('id', ids);
  if (error) throw new Error(`search notes failed: ${error.message}`);
  const byId = new Map(data.map((row) => [row.id as string, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    return [
      {
        id,
        title: row.title as string,
        snippet: extractPlainTextFromDocJson(row.content).slice(
          0,
          SNIPPET_CHARS,
        ),
      },
    ];
  });
}

/** Keep search fresh after a write; semantic search may be unconfigured. */
async function reindexQuietly(
  supabase: SupabaseClient,
  userId: string,
  noteId: string,
): Promise<void> {
  try {
    await upsertSemanticIndexForNote({ supabase, userId, noteId });
  } catch (e) {
    console.warn('[mcp] reindex skipped', e);
  }
}

export async function mcpCreateNote(
  supabase: SupabaseClient,
  userId: string,
  input: { title: string; markdown: string; folderId?: string },
) {
  if (input.folderId) {
    const { data, error } = await supabase
      .from('folders')
      .select('id')
      .eq('id', input.folderId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`folder lookup failed: ${error.message}`);
    if (!data) throw new McpNotFoundError('Folder not found');
  }
  const blocks = markdownToNoteBlocks(input.markdown);
  // No Yjs row: an empty log makes the editor seed its Y.Doc from `content`
  // on first open, so writing the read-model alone is the whole create.
  const note = await createNote(
    supabase as TypedSupabaseClient,
    userId,
    input.title.trim() || 'Untitled Note',
    {
      type: 'doc',
      content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }],
    },
    { folder_id: input.folderId ?? null },
  );
  await reindexQuietly(supabase, userId, note.id);
  return { id: note.id, title: note.title };
}

function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

export async function mcpAppendToNote(
  supabase: SupabaseClient,
  userId: string,
  input: { noteId: string; markdown: string; actor: string },
) {
  const { data: note, error } = await supabase
    .from('notes')
    .select('id,content')
    .eq('id', input.noteId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`append lookup failed: ${error.message}`);
  if (!note) throw new McpNotFoundError('Note not found');

  const blocks = markdownToNoteBlocks(input.markdown);
  if (blocks.length === 0) return { id: input.noteId, appendedBlocks: 0 };

  // Ownership checked above, so the log read/insert below is this user's note.
  const { data: rows, error: logErr } = await supabase
    .from('note_yjs_updates')
    .select('update')
    .eq('note_id', input.noteId)
    .order('seq', { ascending: true });
  if (logErr) throw new Error(`yjs log read failed: ${logErr.message}`);

  // Empty log = never opened in the Yjs editor: it will seed from `content`.
  // Writing a Yjs row now would make it skip that seed and lose the old body.
  if (rows.length > 0) {
    const delta = appendBlocksToYjsLog(
      rows.map((r) => base64ToBytes(r.update as string)),
      blocks,
    );
    const { error: insErr } = await supabase.from('note_yjs_updates').insert({
      note_id: input.noteId,
      update: Buffer.from(delta).toString('base64'),
      actor: input.actor,
    });
    if (insErr) throw new Error(`yjs append failed: ${insErr.message}`);
  }

  // Keep the `content` read-model in step (search, previews, legacy path).
  const doc = (note.content ?? {}) as { content?: unknown[] };
  const { error: upErr } = await supabase
    .from('notes')
    .update({
      content: {
        ...doc,
        type: 'doc',
        content: [
          ...(Array.isArray(doc.content) ? doc.content : []),
          ...blocks,
        ],
      },
    })
    .eq('id', input.noteId)
    .eq('user_id', userId);
  if (upErr) throw new Error(`content append failed: ${upErr.message}`);

  await reindexQuietly(supabase, userId, input.noteId);
  return { id: input.noteId, appendedBlocks: blocks.length };
}
