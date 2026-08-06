import { auth } from '@clerk/nextjs/server';
import { invalidateServerNotaProCache } from '@/server/nota-pro-entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/nota-pro-invalidate — drop the caller's cached entitlement. */
export async function POST(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false }, { status: 401 });
  }
  invalidateServerNotaProCache(userId);
  return Response.json({ ok: true as const });
}
