import { fetchFlight, normalizeFlightCode } from '../lib/flight.server.ts';

/**
 * Public flight lookup for the note flight-code feature. No Bearer: the shared
 * `/s/` page (anon viewers) calls this too. Rate limiting is applied per-IP at
 * the route registration (see `index.ts`), since the Web Request here carries no
 * client IP.
 */
export async function flightHandler(request: Request): Promise<Response> {
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
    // Config error (missing key) vs upstream failure both surface as 502-ish.
    return Response.json({ error: message }, { status: 502 });
  }
}
