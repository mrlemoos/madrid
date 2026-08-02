import { auth } from '@clerk/nextjs/server';
import { getServerNotaProEntitled } from '@/server/nota-pro-entitlement';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/nota-pro-entitled — Clerk session (cookie) → `{ entitled }`. */
export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized', entitled: false },
      { status: 401 },
    );
  }
  const entitled = await getServerNotaProEntitled(userId);
  return Response.json({ entitled });
}
