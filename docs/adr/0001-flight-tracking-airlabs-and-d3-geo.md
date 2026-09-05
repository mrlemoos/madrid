# Flight tracking: AirLabs data via a public proxy, rendered with tile-less d3-geo

The note flight-code feature needs live aircraft position from an IATA flight
code, shown to anonymous viewers on the shared `/s/` page. We source data from
**AirLabs** (free tier maps `flight_iata` → live `lat/lng/dir` with a schedule
fallback) behind a **public, per-IP-rate-limited proxy** on `apps/nota-server`

<!-- The proxy now lives at apps/nota/src/app/api/flight; apps/nota-server was
     deleted per ADR 0004. The decision below is unchanged. -->

(`GET /api/flight`) so the key stays server-side and the anon shared page can
call the same endpoint — unlike the Bearer-gated `og-preview` route. Rendering
uses **d3-geo with a bundled world TopoJSON** (flat map in the hover card,
orthographic globe in the dialog) rather than MapLibre/Leaflet, because a
tile-less vector avoids a tile-provider key, extra CSP origins, and per-view tile
quota, works offline and on `/s/`, and matches Madrid's clean visual style.

## Consequences

- No street/satellite detail (acceptable for "where is the plane over the
  world"). The globe is a ~49 KB-gzip lazy chunk, off the first-paint path.
- Detection is filtered by a **bundled IATA airline-code set** (`iata-airlines.ts`)
  to suppress false positives; an unlisted carrier's code won't be detected until
  its prefix is added.
- The public endpoint trades a small abuse surface (AirLabs quota) for anon
  access; mitigated by CORS allowlist, a per-IP limit, and a 15s server cache.
