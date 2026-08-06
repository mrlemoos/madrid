// Client for the public flight lookup on apps/nota-server. No auth header: the
// route is public so this same call works in the editor AND on the anon shared
// `/s/` page. Reads NEXT_PUBLIC_NOTA_SERVER_API_URL from the bundling app's env.

export type FlightInfo = {
  code: string;
  airlineIata: string | null;
  depIata: string | null;
  arrIata: string | null;
  status: string | null;
  airborne: boolean;
  lat: number | null;
  lng: number | null;
  dir: number | null;
  alt: number | null;
  speed: number | null;
  depTime: string | null;
  arrTime: string | null;
  updated: number | null;
};

/**
 * Fetches flight info by IATA code via the same-origin public Next route
 * `GET /api/flight`. Returns null when the server has no data (404). Throws only
 * on network/5xx so the UI can distinguish "no such flight" from "lookup failed".
 */
export async function fetchFlightInfo(
  code: string,
  signal?: AbortSignal,
): Promise<FlightInfo | null> {
  const res = await fetch(`/api/flight?code=${encodeURIComponent(code)}`, {
    signal,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Flight lookup failed (${res.status})`);
  }
  return (await res.json()) as FlightInfo;
}
