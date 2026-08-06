import { z } from 'zod';
import { requireEntitledUserId } from '@/server/route-auth';
import { semanticSearchNotes } from '@/server/semantic-search-ops.server';
import { requireServiceSupabase } from '@/server/supabase-service.server';
import { rateLimitSemanticSearchPost } from '@/server/user-rate-limit.server';
import {
  isSemanticConfigurationError,
  semanticJsonError,
} from '@/server/semantic-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const searchBodySchema = z.object({ query: z.string().max(4000) });

/** POST /api/semantic-search — entitled semantic vault search. */
export async function POST(request: Request): Promise<Response> {
  const gate = await requireEntitledUserId();
  if (gate instanceof Response) {
    return gate;
  }
  const { userId } = gate;

  if (!rateLimitSemanticSearchPost(userId)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  let bodyJson: unknown;
  try {
    bodyJson = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = searchBodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  try {
    const supabase = requireServiceSupabase();
    const payload = await semanticSearchNotes({
      supabase,
      userId,
      query: parsed.data.query,
    });
    return Response.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isSemanticConfigurationError(msg)) {
      return semanticJsonError(
        { error: 'Semantic search is not configured on the server.' },
        msg,
        503,
      );
    }
    console.error('[semantic-search]', e);
    return semanticJsonError({ error: 'Semantic search failed' }, msg, 500);
  }
}
