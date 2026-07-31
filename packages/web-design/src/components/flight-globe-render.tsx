/**
 * Internal renderer for {@link FlightGlobe} — the tile-less d3-geo visual for an
 * aircraft's position. `variant="flat"` draws a static equirectangular map (for
 * compact surfaces like a hover card); `variant="globe"` draws a draggable
 * orthographic globe (for a dialog). No map-tile provider, so it works offline
 * and adds no CSP origin.
 *
 * @remarks
 * Not a public entry point — consumers import `FlightGlobe` from
 * `@nota/web-design/flight-globe`, which lazy-loads this module (d3-geo + world
 * atlas) into its own chunk.
 *
 * @packageDocumentation
 */

import {
  geoOrthographic,
  geoEquirectangular,
  geoPath,
  geoGraticule10,
  geoDistance,
  type GeoProjection,
} from 'd3-geo';
import { feature } from 'topojson-client';
import worldTopo from 'world-atlas/countries-110m.json';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
  type PointerEvent as ReactPointerEvent,
} from 'react';

// Land polygons, computed once from the bundled world atlas.
const land = feature(
  worldTopo,
  worldTopo.objects.countries,
) as GeoJSON.FeatureCollection;

export type FlightGlobeCoords = { lat: number; lng: number };

export interface FlightGlobeProps {
  /** 'flat' = static equirectangular map; 'globe' = draggable orthographic globe. */
  variant: 'flat' | 'globe';
  width: number;
  height: number;
  /** Live aircraft position, or null when no position is known (route only). */
  position: FlightGlobeCoords | null;
  /** Heading in degrees for the plane glyph. */
  heading?: number | null;
}

interface PlaneGlyphProps {
  x: number;
  y: number;
  heading: number;
}

/** Small plane glyph pointing "up"; caller rotates by heading. */
function PlaneGlyph({ x, y, heading }: PlaneGlyphProps): JSX.Element {
  return (
    <g
      transform={`translate(${String(x)} ${String(y)}) rotate(${String(heading)})`}
    >
      <circle r={9} className="fill-primary/25" />
      <path
        d="M0,-7 L2,-1 L7,3 L7,5 L1,3 L1,6 L3,8 L3,9 L0,8 L-3,9 L-3,8 L-1,6 L-1,3 L-7,5 L-7,3 L-2,-1 Z"
        className="fill-primary"
      />
    </g>
  );
}

export function FlightGlobe({
  variant,
  width,
  height,
  position,
  heading,
}: FlightGlobeProps): JSX.Element {
  // Orthographic rotation (globe only). Start centred on the plane if we have one.
  const [rotation, setRotation] = useState<[number, number]>(() =>
    position ? [-position.lng, -position.lat] : [0, -20],
  );
  const dragRef = useRef<{ x: number; y: number; r: [number, number] } | null>(
    null,
  );

  // Re-centre when a new position arrives and the user isn't dragging.
  useEffect(() => {
    if (variant === 'globe' && position && !dragRef.current) {
      setRotation([-position.lng, -position.lat]);
    }
  }, [variant, position?.lat, position?.lng]);

  const projection = useMemo<GeoProjection>(() => {
    if (variant === 'globe') {
      const p = geoOrthographic().rotate([rotation[0], rotation[1]]);
      p.fitExtent(
        [
          [8, 8],
          [width - 8, height - 8],
        ],
        { type: 'Sphere' },
      );
      return p;
    }
    const p = geoEquirectangular();
    p.fitExtent(
      [
        [2, 2],
        [width - 2, height - 2],
      ],
      { type: 'Sphere' },
    );
    return p;
  }, [variant, width, height, rotation]);

  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule10(), []);

  const marker = useMemo(() => {
    if (!position) return null;
    const xy = projection([position.lng, position.lat]);
    if (!xy) return null;
    if (variant === 'globe') {
      const center: [number, number] = [-rotation[0], -rotation[1]];
      // Hide the plane when it's on the far side of the globe.
      if (geoDistance([position.lng, position.lat], center) > Math.PI / 2) {
        return null;
      }
    }
    return { x: xy[0], y: xy[1] };
  }, [projection, position, variant, rotation]);

  const onPointerDown =
    variant === 'globe'
      ? (e: ReactPointerEvent<SVGSVGElement>) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragRef.current = { x: e.clientX, y: e.clientY, r: rotation };
        }
      : undefined;

  const onPointerMove =
    variant === 'globe'
      ? (e: ReactPointerEvent<SVGSVGElement>) => {
          const d = dragRef.current;
          if (!d) return;
          const k = 0.4; // degrees per pixel
          setRotation([
            d.r[0] + (e.clientX - d.x) * k,
            Math.max(-89, Math.min(89, d.r[1] - (e.clientY - d.y) * k)),
          ]);
        }
      : undefined;

  const endDrag =
    variant === 'globe'
      ? () => {
          dragRef.current = null;
        }
      : undefined;

  const spherePath = path({ type: 'Sphere' }) ?? undefined;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      className={variant === 'globe' ? 'cursor-grab touch-none' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      role="img"
      aria-label="Flight position map"
    >
      {spherePath ? (
        <path d={spherePath} className="fill-muted/40 stroke-border" />
      ) : null}
      <path
        d={path(graticule) ?? undefined}
        className="fill-none stroke-border/40"
        strokeWidth={0.5}
      />
      <path d={path(land) ?? undefined} className="fill-muted-foreground/25" />
      {marker ? (
        <PlaneGlyph x={marker.x} y={marker.y} heading={heading ?? 0} />
      ) : null}
    </svg>
  );
}

export default FlightGlobe;
