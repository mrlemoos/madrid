/**
 * Flight globe / map — a tile-less d3-geo visual for an aircraft's position.
 * This is a light wrapper: the heavy renderer (d3-geo + the bundled world atlas)
 * is dynamically imported so it lands in its own chunk. `FlightGlobe` itself is
 * safe to import statically.
 *
 * @remarks
 * Import from the package subpath only:
 * `import { FlightGlobe } from '@nota/design/flight-globe'`.
 *
 * @packageDocumentation
 */

import { lazy, Suspense, type JSX } from 'react';
import type { FlightGlobeProps } from './flight-globe-render.js';

export type {
  FlightGlobeProps,
  FlightGlobeCoords,
} from './flight-globe-render.js';

const FlightGlobeRender = lazy(() => import('./flight-globe-render.js'));

export function FlightGlobe(props: FlightGlobeProps): JSX.Element {
  return (
    <Suspense
      fallback={
        <div
          style={{ width: props.width, height: props.height }}
          className="bg-muted/30"
        />
      }
    >
      <FlightGlobeRender {...props} />
    </Suspense>
  );
}

export default FlightGlobe;
