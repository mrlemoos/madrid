import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { getServerNotaProEntitled } from './nota-pro-entitlement';

/** Clerk session (cookie) → userId, or a 401 Response. */
export async function requireUserId(): Promise<{ userId: string } | Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { userId };
}

/** Signed-in AND Nota Pro entitled, or a 401/403 Response. */
export async function requireEntitledUserId(): Promise<
  { userId: string } | Response
> {
  const result = await requireUserId();
  if (result instanceof Response) {
    return result;
  }
  if (!(await getServerNotaProEntitled(result.userId))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  return result;
}
