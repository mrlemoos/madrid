// world-atlas ships TopoJSON data files. Type the default export as a Topology
// whose `countries` object is a GeometryCollection, so `topojson-client`'s
// `feature()` accepts it without a cast at the call site.
declare module 'world-atlas/countries-110m.json' {
  import type { Topology, GeometryCollection } from 'topojson-specification';
  const topology: Topology<{ countries: GeometryCollection }>;
  export default topology;
}
