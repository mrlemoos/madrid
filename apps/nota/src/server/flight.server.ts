// Flight lookup by IATA code via AirLabs, for the note flight-code feature.
//
// Access: this route is PUBLIC (no Bearer) because the shared `/s/` note page
// is viewed by people without a Nota account. The AirLabs key stays here on the
// server; the client only ever sees the normalized shape below. Abuse is capped
// by a per-IP rate limit at the route and a short in-memory cache here.

const AIRLABS_BASE = 'https://airlabs.co/api/v9';
const FETCH_TIMEOUT_MS = 8_000;
/** Short cache so a hovered card + its 20s dialog poll don't each hit AirLabs. */
const CACHE_TTL_MS = 15_000;

export type FlightInfo = {
  code: string;
  airlineIata: string | null;
  depIata: string | null;
  arrIata: string | null;
  status: string | null;
  /** True when AirLabs gave a live position (plane is in the air). */
  airborne: boolean;
  lat: number | null;
  lng: number | null;
  /** Heading in degrees. */
  dir: number | null;
  /** Altitude in metres. */
  alt: number | null;
  /** Ground speed in km/h. */
  speed: number | null;
  /** Scheduled departure, ISO/local string from AirLabs. */
  depTime: string | null;
  /** Scheduled arrival. */
  arrTime: string | null;
  /** UNIX seconds of last signal, when airborne. */
  updated: number | null;
};

/**
 * Normalizes a raw flight token to a canonical IATA code, or null if it can't be
 * one. Shape: 2 leading alphanumerics (airline code, e.g. `AA`, `U2`, `3U`) then
 * 1-4 digits. Whitespace is stripped so `AA 123` == `AA123`.
 */
export function normalizeFlightCode(raw: string): string | null {
  const cleaned = raw.replace(/\s+/g, '').toUpperCase();
  // Prefix is 2 alphanumerics with at least one letter (no real airline code is
  // all-digits), then 1-4 digits.
  return /^(?![0-9]{2})[A-Z0-9]{2}\d{1,4}$/.test(cleaned) ? cleaned : null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

type AirlabsRecord = Record<string, unknown>;

/** Pulls the `response` array out of an AirLabs envelope, or [] on error. */
export function airlabsRecords(payload: unknown): AirlabsRecord[] {
  if (!payload || typeof payload !== 'object') return [];
  const resp = (payload as { response?: unknown }).response;
  return Array.isArray(resp) ? (resp as AirlabsRecord[]) : [];
}

/** Live-flights record -> FlightInfo (airborne). */
export function normalizeLive(code: string, r: AirlabsRecord): FlightInfo {
  return {
    code,
    airlineIata: str(r['airline_iata']),
    depIata: str(r['dep_iata']),
    arrIata: str(r['arr_iata']),
    status: str(r['status']),
    airborne: num(r['lat']) !== null && num(r['lng']) !== null,
    lat: num(r['lat']),
    lng: num(r['lng']),
    dir: num(r['dir']),
    alt: num(r['alt']),
    speed: num(r['speed']),
    depTime: null,
    arrTime: null,
    updated: num(r['updated']),
  };
}

/** Schedules record -> FlightInfo (not airborne; times only). */
export function normalizeSchedule(code: string, r: AirlabsRecord): FlightInfo {
  return {
    code,
    airlineIata: str(r['airline_iata']),
    depIata: str(r['dep_iata']),
    arrIata: str(r['arr_iata']),
    status: str(r['status']),
    airborne: false,
    lat: null,
    lng: null,
    dir: null,
    alt: null,
    speed: null,
    depTime: str(r['dep_estimated']) ?? str(r['dep_time']),
    arrTime: str(r['arr_estimated']) ?? str(r['arr_time']),
    updated: null,
  };
}

async function airlabsFetch(
  endpoint: string,
  code: string,
  key: string,
): Promise<unknown> {
  const url = `${AIRLABS_BASE}/${endpoint}?flight_iata=${encodeURIComponent(
    code,
  )}&api_key=${encodeURIComponent(key)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const cache = new Map<string, { at: number; value: FlightInfo | null }>();

/**
 * Looks up a flight by IATA code: live position first, then schedule fallback.
 * Returns null when AirLabs knows nothing about the code. Cached ~15s per code.
 * `AIRLABS_API_KEY` must be set (throws otherwise so the route returns 500).
 */
export async function fetchFlight(rawCode: string): Promise<FlightInfo | null> {
  const code = normalizeFlightCode(rawCode);
  if (!code) return null;

  const cached = cache.get(code);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const key = process.env.AIRLABS_API_KEY?.trim();
  if (!key) {
    throw new Error('AIRLABS_API_KEY is not configured');
  }

  let info: FlightInfo | null = null;

  const live = airlabsRecords(await airlabsFetch('flights', code, key));
  const airborne = live.find(
    (r) => num(r['lat']) !== null && num(r['lng']) !== null,
  );
  if (airborne) {
    info = normalizeLive(code, airborne);
  } else {
    const scheduled = airlabsRecords(
      await airlabsFetch('schedules', code, key),
    );
    if (scheduled.length > 0) {
      info = normalizeSchedule(code, scheduled[0]);
    }
  }

  cache.set(code, { at: Date.now(), value: info });
  return info;
}
