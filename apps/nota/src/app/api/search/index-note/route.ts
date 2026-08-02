import { z } from 'zod';
import { requireEntitledUserId } from '@/server/route-auth';
import { upsertSemanticIndexForNote } from '@/server/semantic-search-ops.server';
import { requireServiceSupabase } from '@/server/supabase-service.server';
import { rateLimitIndexNotePost } from '@/server/user-rate-limit.server';
import {
  isSemanticConfigurationError,
  semanticJsonError,
} from '@/server/semantic-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const indexNoteBodySchema = z.object({ noteId: z.string().uuid() });

/** POST /api/search/index-note — upsert one note's semantic index row. */
export async function POST(request: Request): Promise<Response> {
  const gate = await requireEntitledUserId();
  if (gate instanceof Response) {
    return gate;
  }
  const { userId } = gate;

  if (!rateLimitIndexNotePost(userId)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = indexNoteBodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  try {
    const supabase = requireServiceSupabase();
    const result = await upsertSemanticIndexForNote({
      supabase,
      userId,
      noteId: parsed.data.noteId,
    });
    return Response.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isSemanticConfigurationError(msg)) {
      return semanticJsonError(
        { error: 'Semantic index is not configured on the server.' },
        msg,
        503,
      );
    }
    console.error('[index-note]', e);
    return semanticJsonError({ error: 'Index update failed' }, msg, 500);
  }
}
