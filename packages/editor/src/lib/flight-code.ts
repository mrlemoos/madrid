import { isKnownAirlineCode } from './iata-airlines';

export type FlightCodeMatch = {
  /** Canonical code, no space: `AA123`. */
  code: string;
  /** Offset of the match start within the scanned string. */
  start: number;
  /** Offset just past the match end. */
  end: number;
};

// Uppercase-only prefix keeps prose ("in2024") out; optional single space allows
// "AA 123". \b anchors avoid matching inside longer alphanumerics.
const FLIGHT_CODE_RE = /\b([A-Z0-9]{2})\s?(\d{1,4})\b/g;

/**
 * Finds flight codes in a plain string. A match requires a known IATA airline
 * prefix so ordinary tokens are ignored. The returned `code` is canonical
 * (spaces removed); `start`/`end` index into the original string.
 */
export function findFlightCodes(text: string): FlightCodeMatch[] {
  const out: FlightCodeMatch[] = [];
  for (const m of text.matchAll(FLIGHT_CODE_RE)) {
    const prefix = m[1];
    if (!isKnownAirlineCode(prefix)) continue;
    const start = m.index;
    out.push({
      code: `${prefix}${m[2]}`,
      start,
      end: start + m[0].length,
    });
  }
  return out;
}
