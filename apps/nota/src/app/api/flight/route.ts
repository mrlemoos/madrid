import { fetchFlight, normalizeFlightCode } from '@/server/flight.server';
import { createUserRateLimiter } from '@/server/user-rate-limit.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public (no auth): the anon shared `/s/` page calls this too. Coarse per-IP
// quota protection only (flight codes aren't sensitive).
const rateLimitFlight = createUserRateLimiter({
  key: 'flight',
  max: 60,
  windowMs: 60_000,
});

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

/** GET /api/flight?code= — public flight lookup (AirLabs), rate-limited per IP. */
export async function GET(request: Request): Promise<Response> {
  if (!rateLimitFlight(clientIp(request))) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const raw = new URL(request.url).searchParams.get('code');
  if (!raw) {
    return Response.json({ error: 'Missing code' }, { status: 400 });
  }
  const code = normalizeFlightCode(raw);
  if (!code) {
    return Response.json({ error: 'Invalid flight code' }, { status: 400 });
  }

  try {
    const info = await fetchFlight(code);
    if (!info) {
      return Response.json({ error: 'Flight not found' }, { status: 404 });
    }
    return Response.json(info);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Flight lookup failed';
    return Response.json({ error: message }, { status: 502 });
  }
}
