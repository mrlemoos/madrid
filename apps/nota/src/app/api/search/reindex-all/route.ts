import { requireEntitledUserId } from '@/server/route-auth';
import { reindexAllSemanticNotes } from '@/server/semantic-search-ops.server';
import { requireServiceSupabase } from '@/server/supabase-service.server';
import { rateLimitReindexAllPost } from '@/server/user-rate-limit.server';
import {
  isSemanticConfigurationError,
  semanticJsonError,
} from '@/server/semantic-http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/search/reindex-all — rebuild the caller's whole semantic index. */
export async function POST(): Promise<Response> {
  const gate = await requireEntitledUserId();
  if (gate instanceof Response) {
    return gate;
  }
  const { userId } = gate;

  if (!rateLimitReindexAllPost(userId)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const supabase = requireServiceSupabase();
    const { indexed } = await reindexAllSemanticNotes({ supabase, userId });
    return Response.json({ ok: true, indexed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isSemanticConfigurationError(msg)) {
      return semanticJsonError(
        { error: 'Semantic index is not configured on the server.' },
        msg,
        503,
      );
    }
    console.error('[reindex-all]', e);
    return semanticJsonError({ error: 'Reindex failed' }, msg, 500);
  }
}
