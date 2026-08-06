import { requireEntitledUserId } from '@/server/route-auth';
import { fetchOgPreview } from '@/server/og-preview.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/og-preview?url= — SSRF-safe link unfurl. Entitled users only. */
export async function GET(request: Request): Promise<Response> {
  const gate = await requireEntitledUserId();
  if (gate instanceof Response) {
    return gate;
  }

  const urlParam = new URL(request.url).searchParams.get('url');
  if (!urlParam) {
    return Response.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    return Response.json(await fetchOgPreview(urlParam));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to fetch preview';
    return Response.json({ error: message }, { status: 400 });
  }
}
